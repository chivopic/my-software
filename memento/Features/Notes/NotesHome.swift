import SwiftUI
import MementoCore

struct NotesHome: View {
    @Bindable var library: Library
    @State private var compactColumn: NavigationSplitViewColumn = .content
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var showingLibrary = false
    @State private var showingSettings = false
    @State private var showingWarnings = false
    @State private var permanentDelete: Note?

    var body: some View {
        NavigationSplitView(preferredCompactColumn: $compactColumn) {
            OrganizationSidebar(library: library)
        } content: {
            List(selection: $library.selection) {
                ForEach(library.hits) { hit in
                    NavigationLink(value: hit.id) {
                        NoteRow(hit: hit, query: library.query, root: library.root)
                    }
                    .contextMenu { actions(hit.note) }
                    .swipeActions(edge: .leading) {
                        if hit.note.deletedAt == nil {
                            Button(hit.note.isPinned ? "Unpin" : "Pin", systemImage: "pin") {
                                Task { await library.mutate(hit.note) { $0.isPinned.toggle() } }
                            }.tint(.orange)
                        }
                    }
                    .swipeActions(edge: .trailing) {
                        if hit.note.deletedAt != nil {
                            Button("Restore", systemImage: "arrow.uturn.backward") { Task { await library.restore(hit.id) } }.tint(.green)
                            Button("Delete forever", systemImage: "trash", role: .destructive) { permanentDelete = hit.note }
                        } else {
                            Button("Delete", systemImage: "trash", role: .destructive) { Task { await library.delete(hit.note) } }
                            Button(hit.note.isArchived ? "Unarchive" : "Archive", systemImage: "archivebox") {
                                Task { await library.mutate(hit.note) { $0.isArchived.toggle() } }
                            }.tint(.gray)
                        }
                    }
                }
            }
            .listStyle(.plain)
            .overlay {
                if library.vault == nil {
                    ContentUnavailableView("Library Unavailable", systemImage: "exclamationmark.triangle", description: Text("Check the Memento App Group in Signing & Capabilities, then relaunch the app."))
                } else if !library.ready && library.error == nil { ProgressView("Opening your notes…") }
                else if library.hits.isEmpty && library.query.isEmpty {
                    ContentUnavailableView {
                        Label(library.scope == .deleted ? "Nothing in Recently Deleted" : "A little room to think", systemImage: "note.text")
                    } description: { Text(library.scope == .deleted ? "Deleted notes can be restored here." : "Capture an idea. Keep what matters.") }
                    actions: { if library.scope == .all { Button("Create Note") { Task { await library.create() } }.buttonStyle(.borderedProminent).disabled(!library.ready) } }
                } else if library.hits.isEmpty { ContentUnavailableView.search(text: library.query) }
            }
            .navigationTitle(scopeTitle)
            .searchable(text: $library.query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search notes")
            .searchSuggestions {
                if library.query.isEmpty {
                    ForEach(library.recentSearches, id: \.self) { value in
                        Label(value, systemImage: "clock").searchCompletion(value)
                    }
                    if !library.recentSearches.isEmpty { Button("Clear Recent Searches") { library.clearSearches() } }
                }
            }
            .onSubmit(of: .search) { library.rememberSearch() }
            .onChange(of: library.query) { _, _ in library.search() }
            .onChange(of: library.scope) { _, _ in library.search() }
            .onChange(of: library.scope) { _, _ in compactColumn = .content }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Library", systemImage: "sidebar.left") {
                        if horizontalSizeClass == .compact {
                            showingLibrary = true
                        } else {
                            compactColumn = .sidebar
                        }
                    }
                        .accessibilityIdentifier("library-sidebar")
                }
                ToolbarItem(placement: .primaryAction) {
                    Button("Settings", systemImage: "gearshape") { showingSettings = true }
                        .disabled(!library.ready)
                }
                ToolbarItemGroup(placement: .bottomBar) {
                    Text("\(library.hits.count) notes").font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    if !library.warnings.isEmpty {
                        Button("Storage warnings", systemImage: "exclamationmark.triangle") { showingWarnings = true }
                    }
                    Button("New Note", systemImage: "square.and.pencil") { Task { await library.create() } }
                        .accessibilityIdentifier("new-note").keyboardShortcut("n", modifiers: .command)
                        .disabled(!library.ready)
                }
            }
            .safeAreaInset(edge: .bottom) {
                if library.unsavedCount > 0 {
                    Text("\(library.unsavedCount) unsaved draft(s) kept in memory. Open the note to retry saving.")
                        .font(.footnote).padding(10).frame(maxWidth: .infinity).background(Color(uiColor: .secondarySystemBackground))
                }
                if let deleted = library.undoDeletedID {
                    HStack {
                        Text("Note moved to Recently Deleted").font(.footnote)
                        Spacer()
                        Button("Undo") { Task { await library.restore(deleted) } }
                        Button("Dismiss", systemImage: "xmark") { library.undoDeletedID = nil }.labelStyle(.iconOnly)
                    }.padding(12).background(.bar)
                }
            }
        } detail: {
            if let id = library.selection, let note = library.notes.first(where: { $0.id == id }), note.deletedAt == nil {
                NoteEditor(note: note, library: library).id(id)
            } else {
                ContentUnavailableView("Select a Note", systemImage: "note.text", description: Text("A place for your words, plans and ideas."))
            }
        }
        .onChange(of: library.selection) { _, id in
            compactColumn = id == nil ? .content : .detail
            if id != nil { library.rememberSearch() }
        }
        .sheet(isPresented: $showingLibrary) {
            NavigationStack {
                OrganizationSidebar(library: library, onChoose: { showingLibrary = false })
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Done") { showingLibrary = false }
                        }
                    }
            }
        }
        .sheet(isPresented: $showingSettings) { NavigationStack { SettingsView(library: library) } }
        .sheet(isPresented: $showingWarnings) {
            NavigationStack {
                List(library.warnings, id: \.self) { Text($0).font(.footnote) }
                    .navigationTitle("Storage Warnings")
                    .toolbar { Button("Done") { showingWarnings = false } }
            }
        }
        .alert("Could Not Complete the Action", isPresented: Binding(get: { library.error != nil }, set: { if !$0 { library.error = nil } })) {
            Button("OK") { library.error = nil }
        } message: { Text(library.error ?? "") }
        .confirmationDialog("Permanently delete this note and its attachments?", isPresented: Binding(get: { permanentDelete != nil }, set: { if !$0 { permanentDelete = nil } }), titleVisibility: .visible) {
            Button("Delete Forever", role: .destructive) {
                if let note = permanentDelete {
                    library.run {
                        try await library.vault?.permanentlyDelete(note.id)
                        if library.undoDeletedID == note.id { library.undoDeletedID = nil }
                    }
                }
                permanentDelete = nil
            }
        }
    }

    @ViewBuilder private func actions(_ note: Note) -> some View {
        if note.deletedAt != nil {
            Button("Restore", systemImage: "arrow.uturn.backward") { Task { await library.restore(note.id) } }
            Button("Delete Forever", systemImage: "trash", role: .destructive) { permanentDelete = note }
        } else {
            Button(note.isPinned ? "Unpin" : "Pin", systemImage: "pin") { Task { await library.mutate(note) { $0.isPinned.toggle() } } }
            Button(note.isArchived ? "Unarchive" : "Archive", systemImage: "archivebox") { Task { await library.mutate(note) { $0.isArchived.toggle() } } }
            Button("Delete", systemImage: "trash", role: .destructive) { Task { await library.delete(note) } }
        }
    }
    private var scopeTitle: String {
        switch library.scope {
        case .all: "Notes"
        case .pinned: "Pinned"
        case .recent: "Recently Edited"
        case .archived: "Archive"
        case .deleted: "Recently Deleted"
        case .folder(let id): library.folders.first(where: { $0.id == id })?.name ?? "Folder"
        case .tag(let tag): "#\(tag)"
        }
    }
}

struct NoteRow: View {
    var hit: SearchHit
    var query: String
    var root: URL?
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    if hit.note.isPinned { Image(systemName: "pin.fill").font(.caption).foregroundStyle(.orange).accessibilityLabel("Pinned") }
                    HighlightedText(text: hit.note.displayTitle, query: query).font(.headline).lineLimit(1)
                }
                HighlightedText(text: hit.snippet.isEmpty ? "No additional text" : hit.snippet, query: query)
                    .font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
                HStack {
                    Text(hit.note.modifiedAt, style: .relative)
                    if !hit.note.tags.isEmpty { Text(hit.note.tags.map { "#\($0)" }.joined(separator: " ")).lineLimit(1) }
                }.font(.caption).foregroundStyle(.tertiary)
            }
            Spacer(minLength: 0)
            if let root, let image = hit.note.attachments.first(where: \.isImage) {
                LocalImage(url: root.appendingPathComponent("vault/attachments/\(image.filename)"))
                    .frame(width: 52, height: 52).clipped().accessibilityHidden(true)
            }
        }.padding(.vertical, 8)
    }
}
