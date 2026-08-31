import Foundation

@MainActor
final class VaultStore {
    private(set) var rootURL: URL?
    private(set) var notes: [Note] = []

    func open(_ url: URL) throws {
        rootURL = url
        try reload()
    }

    func reload() throws {
        guard let rootURL else {
            notes = []
            return
        }

        let keys: Set<URLResourceKey> = [.contentModificationDateKey, .isRegularFileKey]
        let files = FileManager.default.enumerator(
            at: rootURL,
            includingPropertiesForKeys: Array(keys),
            options: [.skipsHiddenFiles, .skipsPackageDescendants]
        )

        notes = try (files?.compactMap { item -> Note? in
            guard let url = item as? URL, url.pathExtension.lowercased() == "md" else { return nil }
            let values = try url.resourceValues(forKeys: keys)
            guard values.isRegularFile == true else { return nil }
            let content = try String(contentsOf: url, encoding: .utf8)
            return Note(
                url: url,
                title: NoteMetadata.title(from: content, fallback: url.deletingPathExtension().lastPathComponent),
                preview: NoteMetadata.preview(from: content),
                modifiedAt: values.contentModificationDate ?? .distantPast
            )
        } ?? []).sorted { $0.modifiedAt > $1.modifiedAt }
    }

    func content(for note: Note) throws -> String {
        try String(contentsOf: note.url, encoding: .utf8)
    }

    func save(_ content: String, for note: Note) throws {
        try content.write(to: note.url, atomically: true, encoding: .utf8)
        try reload()
    }

    func createNote() throws -> Note {
        guard let rootURL else { throw VaultError.noVault }
        var index = 0
        var url: URL
        repeat {
            index += 1
            let suffix = index == 1 ? "" : " \(index)"
            url = rootURL.appendingPathComponent("Untitled Note\(suffix).md")
        } while FileManager.default.fileExists(atPath: url.path)

        try "# Untitled Note\n\n".write(to: url, atomically: true, encoding: .utf8)
        try reload()
        guard let note = notes.first(where: { $0.url == url }) else { throw VaultError.cannotCreate }
        return note
    }

    func filteredNotes(query: String) -> [Note] {
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !term.isEmpty else { return notes }
        return notes.filter { note in
            note.title.localizedCaseInsensitiveContains(term)
                || note.preview.localizedCaseInsensitiveContains(term)
                || note.url.path.localizedCaseInsensitiveContains(term)
        }
    }
}

enum VaultError: LocalizedError {
    case noVault
    case cannotCreate

    var errorDescription: String? {
        switch self {
        case .noVault: "Open a Vault before creating a note."
        case .cannotCreate: "The note could not be created."
        }
    }
}
