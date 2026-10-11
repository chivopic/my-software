import SwiftUI
import MementoCore

struct OrganizationSidebar: View {
    @Bindable var library: Library
    var onChoose: (() -> Void)? = nil
    @State private var addingFolder = false
    @State private var editingFolder: Folder?
    var body: some View {
        List(selection: Binding<NoteScope?>(get: { library.scope }, set: { scope in
            if let scope { library.scope = scope; library.selection = nil }
        })) {
            Section {
                entry("All Notes", "note.text", .all)
                entry("Pinned", "pin", .pinned)
                entry("Recently Edited", "clock", .recent)
            }
            Section("Folders") {
                ForEach(flatFolders, id: \.folder.id) { row in
                    folderEntry(row.folder, depth: row.depth)
                }
                Button("New Folder", systemImage: "folder.badge.plus") { addingFolder = true }
                    .accessibilityIdentifier("new-folder")
            }
            if !tags.isEmpty {
                Section("Tags") { ForEach(tags, id: \.self) { tag in entry(tag, "number", .tag(tag)) } }
            }
            Section {
                entry("Archive", "archivebox", .archived)
                entry("Recently Deleted", "trash", .deleted)
            }
        }
        .navigationTitle("Library")
        .sheet(isPresented: $addingFolder) { FolderForm(library: library, folder: nil) }
        .sheet(item: $editingFolder) { folder in FolderForm(library: library, folder: folder) }
    }
    @ViewBuilder private func entry(_ title: String, _ symbol: String, _ scope: NoteScope) -> some View {
        if onChoose != nil {
            Button { choose(scope) } label: { Label(title, systemImage: symbol) }
        } else {
            NavigationLink(value: scope) { Label(title, systemImage: symbol) }
        }
    }
    @ViewBuilder private func folderEntry(_ folder: Folder, depth: Int) -> some View {
        Group {
            if onChoose != nil {
                Button { choose(.folder(folder.id)) } label: {
                    Label(folder.name, systemImage: "folder").padding(.leading, CGFloat(depth * 14))
                }
            } else {
                NavigationLink(value: NoteScope.folder(folder.id)) {
                    Label(folder.name, systemImage: "folder").padding(.leading, CGFloat(depth * 14))
                }
            }
        }.contextMenu {
            Button("Edit Folder", systemImage: "pencil") { editingFolder = folder }
            Button("Remove Folder", systemImage: "folder.badge.minus") {
                library.run { try await library.vault?.removeFolder(folder.id); library.scope = .all }
            }
        }
    }
    private func choose(_ scope: NoteScope) {
        library.scope = scope
        library.selection = nil
        onChoose?()
    }
    private var tags: [String] { Array(Set(library.notes.filter { $0.deletedAt == nil }.flatMap(\.tags))).sorted() }
    private var flatFolders: [(folder: Folder, depth: Int)] {
        func flatten(parent: UUID?, depth: Int) -> [(folder: Folder, depth: Int)] {
            library.folders.filter { $0.parentID == parent }.sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
                .flatMap { [($0, depth)] + flatten(parent: $0.id, depth: depth + 1) }
        }
        return flatten(parent: nil, depth: 0)
    }
}

struct FolderForm: View {
    var library: Library
    var folder: Folder?
    @State private var name = ""
    @State private var parent: UUID?
    @State private var error: String?
    @State private var saving = false
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            Form {
                TextField("Folder Name", text: $name)
                Picker("Parent", selection: $parent) {
                    Text("Top Level").tag(Optional<UUID>.none)
                    ForEach(library.folders.filter { $0.id != folder?.id }) { folder in Text(folder.name).tag(Optional(folder.id)) }
                }
                if let error { Text(error).foregroundStyle(.red) }
            }
            .navigationTitle(folder == nil ? "New Folder" : "Edit Folder")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saving = true
                        Task {
                            do {
                                let item = Folder(id: folder?.id ?? UUID(), name: name.trimmingCharacters(in: .whitespacesAndNewlines), parentID: parent)
                                try await library.vault?.putFolder(item); await library.refresh(); dismiss()
                            } catch { self.error = error.localizedDescription }
                            saving = false
                        }
                    }.disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || saving)
                }
            }
            .onAppear { name = folder?.name ?? ""; parent = folder?.parentID }
        }
    }
}
