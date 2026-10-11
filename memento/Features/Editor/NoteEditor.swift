import SwiftUI
import PhotosUI
import QuickLook
import UniformTypeIdentifiers
import MementoCore

@MainActor struct NoteEditor: View {
    var library: Library
    @State private var session: EditorSession
    @State private var commands = EditorCommands()
    @State private var preview = false
    @State private var organizing = false
    @State private var details = false
    @State private var importAttachment = false
    @State private var photo: PhotosPickerItem?
    @State private var showingPhotos = false
    @State private var addingAttachment = false
    @State private var exportDocument: MarkdownExportDocument?
    @State private var exporting = false
    @State private var confirmDelete = false
    @FocusState private var focusTitle: Bool
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("fontScale") private var fontScale = 1.0
    @AppStorage("spellcheck") private var spellcheck = true

    init(note: Note, library: Library) {
        self.library = library
        _session = State(initialValue: EditorSession(note: note, library: library))
    }

    var body: some View {
        VStack(spacing: 0) {
            TextField("Title", text: Binding(get: { session.note.title }, set: { session.note.title = $0; session.changed() }), axis: .vertical)
                .font(.title.bold()).lineLimit(1...4).padding(.horizontal, DesignTokens.bodyInset).padding(.top, 12)
                .focused($focusTitle).accessibilityIdentifier("note-title")
            if preview {
                MarkdownPreview(bodyText: session.note.body, root: library.root) { line in
                    var lines = session.note.body.components(separatedBy: "\n")
                    guard lines.indices.contains(line) else { return }
                    if lines[line].hasPrefix("- [ ] ") { lines[line] = "- [x] " + lines[line].dropFirst(6) }
                    else { lines[line] = "- [ ] " + lines[line].dropFirst(6) }
                    session.note.body = lines.joined(separator: "\n"); session.changed(); DesignTokens.feedback()
                }
            } else {
                MarkdownTextView(text: Binding(get: { session.note.body }, set: { session.note.body = $0; session.changed() }),
                                 commands: commands, fontScale: fontScale, spellcheck: spellcheck)
            }
            if let failure = session.failure {
                VStack(alignment: .leading, spacing: 8) {
                    Text(failure).font(.footnote)
                    HStack {
                        Button("Retry Save") { Task { await session.flush() } }
                        Button("Save Recovery Copy") { Task { await session.saveCopy() } }
                    }
                }.padding(12).frame(maxWidth: .infinity, alignment: .leading).background(Color(uiColor: .secondarySystemBackground))
            }
            Text(addingAttachment ? "Adding attachment…" : session.status).font(.caption).foregroundStyle(.secondary)
                .padding(.bottom, 6).accessibilityIdentifier("save-status")
        }
        .disabled(addingAttachment)
        .navigationTitle("").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(preview ? "Edit" : "Preview", systemImage: preview ? "pencil" : "eye") {
                    commitInput(); preview.toggle()
                }.accessibilityIdentifier("toggle-preview")
            }
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Menu("Format", systemImage: "textformat") {
                        ForEach(MarkdownCommand.allCases, id: \.self) { command in
                            Button(command.label, systemImage: command.symbol) { commands.apply(command) }.disabled(preview)
                        }
                    }
                    Button("Undo", systemImage: "arrow.uturn.backward") { commands.undo() }.disabled(preview)
                    Button("Redo", systemImage: "arrow.uturn.forward") { commands.redo() }.disabled(preview)
                    Divider()
                    Button("Folder & Tags", systemImage: "folder") { organizing = true }
                    Button(session.note.isPinned ? "Unpin" : "Pin", systemImage: "pin") { session.note.isPinned.toggle(); session.changed() }
                    Button(session.note.isArchived ? "Unarchive" : "Archive", systemImage: "archivebox") { session.note.isArchived.toggle(); session.changed() }
                    Button("Add Photo", systemImage: "photo") { showingPhotos = true }
                    Button("Add Attachment", systemImage: "paperclip") { importAttachment = true }
                    Button("Links & Attachments", systemImage: "link") { details = true }
                    Button("Export Markdown", systemImage: "square.and.arrow.up") {
                        commitInput()
                        do { exportDocument = try MarkdownExportDocument(note: session.note); exporting = true }
                        catch { library.error = error.localizedDescription }
                    }
                    Button("Delete Note", systemImage: "trash", role: .destructive) { confirmDelete = true }
                } label: { Image(systemName: "ellipsis.circle") }
                .accessibilityLabel("Note Actions")
                .accessibilityIdentifier("note-actions")
            }
        }
        .onAppear {
            library.activeDraft = session
            if session.note.title.isEmpty && session.note.body.isEmpty { focusTitle = true }
        }
        .onDisappear {
            commitInput(); flushForLifecycle()
            if library.activeDraft === session { library.activeDraft = nil }
        }
        .onChange(of: scenePhase) { _, phase in if phase != .active { commitInput(); flushForLifecycle() } }
        .sheet(isPresented: $organizing) { NoteOrganization(session: session, library: library) }
        .sheet(isPresented: $details) { NoteDetails(note: session.note, library: library) }
        .fileExporter(isPresented: $exporting, document: exportDocument, contentType: .plainText, defaultFilename: "\(safeTitle).md") { result in
            if case .failure(let error) = result { library.error = error.localizedDescription }
        }
        .fileImporter(isPresented: $importAttachment, allowedContentTypes: [.data], allowsMultipleSelection: false) { result in
            switch result {
            case .success(let urls): if let url = urls.first { Task { await attach(url) } }
            case .failure(let error): library.error = error.localizedDescription
            }
        }
        .onChange(of: photo) { _, item in
            guard let item else { return }
            Task {
                do {
                    guard let data = try await item.loadTransferable(type: Data.self) else { throw CocoaError(.fileReadUnknown) }
                    let ext = item.supportedContentTypes.first?.preferredFilenameExtension ?? "jpg"
                    await attach(data: data, name: "Photo.\(ext)", image: true)
                } catch { library.error = error.localizedDescription }
                photo = nil
            }
        }
        .photosPicker(isPresented: $showingPhotos, selection: $photo, matching: .images)
        .confirmationDialog("Move this note to Recently Deleted?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete Note", role: .destructive) {
                commitInput()
                Task { await session.flush(); guard session.failure == nil else { return }; await library.delete(session.note) }
            }
        }
    }

    private var safeTitle: String {
        String(session.note.displayTitle.map { "/\\:".contains($0) ? "-" : $0 }.prefix(80))
    }
    private func commitInput() {
        commands.view?.unmarkText()
        if let view = commands.view { view.delegate?.textViewDidChange?(view) }
        commands.dismissKeyboard(); focusTitle = false
    }
    private func flushForLifecycle() {
        let token = UIApplication.shared.beginBackgroundTask(withName: "Save note")
        Task { await session.flush(); if token != .invalid { UIApplication.shared.endBackgroundTask(token) } }
    }
    private func attach(_ url: URL) async {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        do {
            let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
            guard size <= 25 * 1024 * 1024 else { throw VaultError.oversizedAttachment }
            let data = try await Task.detached { try Data(contentsOf: url) }.value
            let type = UTType(filenameExtension: url.pathExtension)
            await attach(data: data, name: url.lastPathComponent, image: type?.conforms(to: .image) == true)
        } catch { library.error = error.localizedDescription }
    }
    private func attach(data: Data, name: String, image: Bool) async {
        commitInput(); addingAttachment = true
        defer { addingAttachment = false }
        await session.flush()
        guard session.failure == nil, let vault = library.vault else { return }
        do {
            session.note = try await vault.addAttachment(to: session.note.id, data: data, name: name, isImage: image)
            await library.refresh()
        } catch { library.error = error.localizedDescription }
    }
}

struct NoteOrganization: View {
    @Bindable var session: EditorSession
    var library: Library
    @State private var tags = ""
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            Form {
                Picker("Folder", selection: $session.note.folderID) {
                    Text("No Folder").tag(Optional<UUID>.none)
                    ForEach(library.folders) { folder in Text(folder.name).tag(Optional(folder.id)) }
                }.onChange(of: session.note.folderID) { _, _ in session.changed() }
                TextField("Tags, separated by commas", text: $tags).textInputAutocapitalization(.never)
                    .onChange(of: tags) { _, value in
                        let normalized = Array(Set(value.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty })).sorted()
                        if normalized != session.note.tags { session.note.tags = normalized; session.changed() }
                    }
                Text("Use [[Note Title]] in the body to link another note.").font(.footnote).foregroundStyle(.secondary)
            }
            .navigationTitle("Organize Note")
            .toolbar { Button("Done") { dismiss() } }
            .onAppear { tags = session.note.tags.joined(separator: ", ") }
        }
    }
}

struct NoteDetails: View {
    var note: Note
    var library: Library
    @State private var attachmentURL: URL?
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                Section("Links") {
                    ForEach(note.wikiLinks, id: \.self) { title in
                        if let target = library.notes.first(where: { $0.deletedAt == nil && NoteSearch.equivalent($0.displayTitle, title) }) {
                            Button(title, systemImage: "link") { library.selection = target.id; dismiss() }
                        } else {
                            Button("Create “\(title)”", systemImage: "plus") {
                                library.run {
                                    if let target = try await library.vault?.create(title: title) { library.selection = target.id; dismiss() }
                                }
                            }
                        }
                    }
                    if note.wikiLinks.isEmpty { Text("No outgoing links").foregroundStyle(.secondary) }
                }
                Section("Backlinks") {
                    ForEach(WikiLinks.backlinks(to: note, in: library.notes)) { source in
                        Button(source.displayTitle, systemImage: "arrow.turn.up.left") { library.selection = source.id; dismiss() }
                    }
                }
                Section("Attachments") {
                    ForEach(note.attachments) { attachment in
                        Button {
                            Task {
                                do { attachmentURL = try await library.vault?.attachmentURL(attachment) }
                                catch { library.error = error.localizedDescription }
                            }
                        } label: { Label(attachment.name, systemImage: attachment.isImage ? "photo" : "doc") }
                    }
                    if note.attachments.isEmpty { Text("No attachments").foregroundStyle(.secondary) }
                }
                Section("On This Device") {
                    LabeledContent("Created", value: note.createdAt.formatted())
                    LabeledContent("Updated", value: note.modifiedAt.formatted())
                    LabeledContent("Revision", value: String(note.revision))
                }
            }.navigationTitle("Note Details").toolbar { Button("Done") { dismiss() } }
                .quickLookPreview($attachmentURL)
        }
    }
}
