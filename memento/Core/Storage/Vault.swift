import Foundation

public actor Vault {
    public let root: URL
    private var notes: [UUID: Note] = [:]
    private var folders: [Folder] = []
    private var warnings: [String] = []
    private let fm = FileManager.default

    public init(root: URL) { self.root = root.resolvingSymlinksInPath() }

    public func load() throws -> VaultSnapshot {
        try fm.createDirectory(at: root.appendingPathComponent("notes"), withIntermediateDirectories: true)
        try fm.createDirectory(at: root.appendingPathComponent("attachments"), withIntermediateDirectories: true)
        warnings = []; notes = [:]
        let catalog = root.appendingPathComponent("folders.json")
        if fm.fileExists(atPath: catalog.path) {
            folders = try JSONDecoder().decode([Folder].self, from: Data(contentsOf: catalog))
            try validateFolders(folders)
        } else { folders = [] }
        for url in try fm.contentsOfDirectory(at: root.appendingPathComponent("notes"), includingPropertiesForKeys: nil)
            where url.pathExtension == "md" {
            do {
                try ensureRegularFile(url)
                let note = try MarkdownFile.decode(Data(contentsOf: url))
                guard url.deletingPathExtension().lastPathComponent == note.id.uuidString else { throw VaultError.invalidMarkdown }
                for attachment in note.attachments { _ = try attachmentURL(attachment) }
                notes[note.id] = note
            } catch { warnings.append("\(url.lastPathComponent): \(error.localizedDescription)") }
        }
        return snapshot()
    }

    public func snapshot() -> VaultSnapshot {
        VaultSnapshot(notes: notes.values.sorted { $0.modifiedAt > $1.modifiedAt }, folders: folders, warnings: warnings)
    }

    public func create(title: String = "", body: String = "", folderID: UUID? = nil, id: UUID = UUID()) throws -> Note {
        guard notes[id] == nil else { throw VaultError.conflict }
        return try save(Note(id: id, title: title, body: body, folderID: folderID), expectedRevision: nil)
    }

    @discardableResult
    public func save(_ draft: Note, expectedRevision: Int?) throws -> Note {
        if let old = notes[draft.id] {
            guard expectedRevision == old.revision else { throw VaultError.conflict }
        } else if expectedRevision != nil { throw VaultError.missingNote }
        if let id = draft.folderID, !folders.contains(where: { $0.id == id }) { throw VaultError.invalidFolder }
        var note = draft
        note.revision = (notes[note.id]?.revision ?? 0) + 1
        note.modifiedAt = Date()
        note.tags = Array(Set(note.tags.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty })).sorted()
        for attachment in note.attachments { _ = try attachmentURL(attachment) }
        try AtomicFile.write(try MarkdownFile.encode(note), to: noteURL(note.id))
        notes[note.id] = note
        return note
    }

    public func softDelete(_ id: UUID) throws -> Note {
        guard var note = notes[id] else { throw VaultError.missingNote }
        note.deletedAt = Date()
        return try save(note, expectedRevision: note.revision)
    }

    public func restore(_ id: UUID) throws -> Note {
        guard var note = notes[id] else { throw VaultError.missingNote }
        note.deletedAt = nil
        return try save(note, expectedRevision: note.revision)
    }

    public func permanentlyDelete(_ id: UUID) throws {
        guard let note = notes[id], note.deletedAt != nil else { throw VaultError.missingNote }
        try fm.removeItem(at: noteURL(id))
        notes[id] = nil
        // Shared/imported attachment references must remain readable by surviving notes.
        for attachment in note.attachments where !notes.values.contains(where: { $0.attachments.contains(where: { $0.filename == attachment.filename }) }) {
            let url = try attachmentURL(attachment)
            if fm.fileExists(atPath: url.path) { try fm.removeItem(at: url) }
        }
    }

    public func putFolder(_ folder: Folder) throws {
        var updated = folders.filter { $0.id != folder.id }; updated.append(folder)
        try validateFolders(updated)
        try AtomicFile.write(try JSONEncoder().encode(updated), to: root.appendingPathComponent("folders.json"))
        folders = updated
    }

    public func removeFolder(_ id: UUID) throws {
        guard let folder = folders.first(where: { $0.id == id }) else { throw VaultError.invalidFolder }
        // Move notes before changing the catalog; interruptions never leave a dangling folderID.
        for var note in notes.values.filter({ $0.folderID == id }) {
            note.folderID = folder.parentID
            try save(note, expectedRevision: note.revision)
        }
        let updated = folders.filter { $0.id != id }.map { entry -> Folder in
            var child = entry
            if child.parentID == id { child.parentID = folder.parentID }
            return child
        }
        try AtomicFile.write(try JSONEncoder().encode(updated), to: root.appendingPathComponent("folders.json"))
        folders = updated
    }

    public func addAttachment(to id: UUID, data: Data, name: String, isImage: Bool) throws -> Note {
        guard var note = notes[id] else { throw VaultError.missingNote }
        guard data.count <= 25 * 1024 * 1024 else { throw VaultError.oversizedAttachment }
        let attachmentID = UUID()
        let ext = safeExtension(name)
        let attachment = Attachment(id: attachmentID, name: URL(fileURLWithPath: name).lastPathComponent,
                                    filename: "\(attachmentID.uuidString).\(ext)", byteCount: data.count, isImage: isImage)
        let url = try attachmentURL(attachment)
        try AtomicFile.write(data, to: url)
        note.attachments.append(attachment)
        let reference = "attachments/\(attachment.filename)"
        let label = attachment.name.replacingOccurrences(of: "]", with: "").replacingOccurrences(of: "[", with: "")
        note.body += "\n\(isImage ? "!" : "")[\(label)](\(reference))\n"
        do { return try save(note, expectedRevision: note.revision) }
        catch { try? fm.removeItem(at: url); throw error }
    }

    public func attachmentURL(_ attachment: Attachment) throws -> URL {
        guard !attachment.filename.contains("/"), !attachment.filename.contains("\\"),
              attachment.filename != ".", attachment.filename != "..", !attachment.filename.isEmpty else { throw VaultError.unsafePath }
        let url = root.appendingPathComponent("attachments", isDirectory: true).appendingPathComponent(attachment.filename)
        if fm.fileExists(atPath: url.path) { try ensureRegularFile(url) }
        return url
    }

    public func importMarkdown(_ data: Data, filename: String) throws -> Note {
        var note = try MarkdownFile.decode(data, fallbackTitle: URL(fileURLWithPath: filename).deletingPathExtension().lastPathComponent)
        note.id = UUID(); note.folderID = nil; note.revision = 0
        // A standalone file cannot supply its attachment files. Preserve links and report missing files in UI.
        note.attachments = []; note.deletedAt = nil
        return try save(note, expectedRevision: nil)
    }

    public func exportBackup(to destination: URL) throws {
        guard warnings.isEmpty else {
            throw NSError(domain: "Memento.Backup", code: 1, userInfo: [NSLocalizedDescriptionKey: "Resolve the storage warnings before making a complete backup. Unreadable originals remain on this device."])
        }
        guard !fm.fileExists(atPath: destination.path) else { throw VaultError.invalidArchive }
        try fm.createDirectory(at: destination.appendingPathComponent("notes"), withIntermediateDirectories: true)
        try fm.createDirectory(at: destination.appendingPathComponent("attachments"), withIntermediateDirectories: true)
        try AtomicFile.write(try JSONEncoder().encode(folders), to: destination.appendingPathComponent("folders.json"))
        for note in notes.values {
            try AtomicFile.write(try MarkdownFile.encode(note), to: destination.appendingPathComponent("notes/\(note.id.uuidString).md"))
            for attachment in note.attachments {
                let target = destination.appendingPathComponent("attachments/\(attachment.filename)")
                if !fm.fileExists(atPath: target.path) { try fm.copyItem(at: attachmentURL(attachment), to: target) }
            }
        }
        try AtomicFile.write(Data("Memento vault v1\n".utf8), to: destination.appendingPathComponent("manifest.txt"))
    }

    /// Additive restore: imported note IDs are remapped, so an existing note is never overwritten.
    public func importBackup(from source: URL) throws -> Int {
        try ensureRegularFile(source.appendingPathComponent("manifest.txt"))
        try ensureRegularFile(source.appendingPathComponent("folders.json"))
        guard try String(contentsOf: source.appendingPathComponent("manifest.txt"), encoding: .utf8) == "Memento vault v1\n" else { throw VaultError.invalidArchive }
        let importedFolders = try JSONDecoder().decode([Folder].self, from: Data(contentsOf: source.appendingPathComponent("folders.json")))
        try validateFolders(importedFolders)
        let folderMap = Dictionary(uniqueKeysWithValues: importedFolders.map { ($0.id, UUID()) })
        var prepared: [(Note, [(Attachment, Data)])] = []
        for url in try fm.contentsOfDirectory(at: source.appendingPathComponent("notes"), includingPropertiesForKeys: nil) where url.pathExtension == "md" {
            try ensureRegularFile(url)
            var note = try MarkdownFile.decode(Data(contentsOf: url))
            guard url.deletingPathExtension().lastPathComponent == note.id.uuidString else { throw VaultError.invalidArchive }
            if let folderID = note.folderID, folderMap[folderID] == nil { throw VaultError.invalidArchive }
            note.id = UUID(); note.revision = 0; note.folderID = note.folderID.flatMap { folderMap[$0] }
            var blobs: [(Attachment, Data)] = []
            for attachment in note.attachments {
                _ = try attachmentURL(attachment)
                let original = source.appendingPathComponent("attachments/\(attachment.filename)")
                try ensureRegularFile(original)
                let data = try Data(contentsOf: original)
                guard data.count == attachment.byteCount, data.count <= 25 * 1024 * 1024 else { throw VaultError.invalidArchive }
                var copy = attachment; copy.id = UUID(); copy.filename = "\(copy.id.uuidString).\(safeExtension(attachment.filename))"
                note.body = note.body.replacingOccurrences(of: "attachments/\(attachment.filename)", with: "attachments/\(copy.filename)")
                blobs.append((copy, data))
            }
            note.attachments = blobs.map(\.0); prepared.append((note, blobs))
        }
        // Validate the entire backup before touching the current vault.
        let mapped = importedFolders.map { Folder(id: folderMap[$0.id]!, name: $0.name, parentID: $0.parentID.flatMap { folderMap[$0] }) }
        let catalog = folders + mapped
        try validateFolders(catalog)
        try AtomicFile.write(try JSONEncoder().encode(catalog), to: root.appendingPathComponent("folders.json")); folders = catalog
        for (note, blobs) in prepared {
            for (attachment, data) in blobs { try AtomicFile.write(data, to: attachmentURL(attachment)) }
            try save(note, expectedRevision: nil)
        }
        return prepared.count
    }

    public func ingestInbox() throws -> Int {
        let inbox = root.deletingLastPathComponent().appendingPathComponent("inbox")
        guard fm.fileExists(atPath: inbox.path) else { return 0 }
        var count = 0
        for directory in try fm.contentsOfDirectory(at: inbox, includingPropertiesForKeys: nil) {
            let manifest = directory.appendingPathComponent("capture.json")
            guard fm.fileExists(atPath: manifest.path) else { continue } // In-progress captures are not visible yet.
            do {
                try ensureRegularFile(manifest)
                let capture = try JSONDecoder().decode(Capture.self, from: Data(contentsOf: manifest))
                guard directory.lastPathComponent == capture.id.uuidString else { throw VaultError.invalidArchive }
                if notes[capture.id] == nil {
                    var note = Note(id: capture.id, title: capture.title, body: capture.body)
                    for attachment in capture.attachments {
                        _ = try attachmentURL(attachment)
                        let file = directory.appendingPathComponent(attachment.filename)
                        try ensureRegularFile(file)
                        let data = try Data(contentsOf: file)
                        guard data.count <= 25 * 1024 * 1024 else { throw VaultError.oversizedAttachment }
                        try AtomicFile.write(data, to: attachmentURL(attachment))
                        note.attachments.append(attachment)
                        note.body += "\n\(attachment.isImage ? "!" : "")[Attachment](attachments/\(attachment.filename))\n"
                    }
                    try save(note, expectedRevision: nil); count += 1
                }
                try fm.removeItem(at: directory)
            } catch { warnings.append("Capture \(directory.lastPathComponent): \(error.localizedDescription)") }
        }
        return count
    }

    public func writePrivacy(locked: Bool) throws {
        try writeWidgetSnapshot(locked: locked)
        try AtomicFile.write(try JSONEncoder().encode(PrivacyState(lockEnabled: locked)), to: root.deletingLastPathComponent().appendingPathComponent("privacy.json"))
    }

    public func writeWidgetSnapshot(locked: Bool) throws {
        let visible = notes.values.filter { $0.deletedAt == nil && !$0.isArchived }.sorted { $0.modifiedAt > $1.modifiedAt }
        let snapshot = WidgetSnapshot(isPrivate: locked, notes: locked ? [] : visible.prefix(5).map { WidgetNote(id: $0.id, title: $0.displayTitle) })
        try AtomicFile.write(try JSONEncoder().encode(snapshot), to: root.deletingLastPathComponent().appendingPathComponent("widget.json"))
    }

    public func storageBytes() throws -> Int {
        guard let enumerator = fm.enumerator(at: root, includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey]) else { return 0 }
        var bytes = 0
        for case let url as URL in enumerator {
            let values = try url.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey])
            if values.isRegularFile == true { bytes += values.fileSize ?? 0 }
        }
        return bytes
    }

    private func noteURL(_ id: UUID) -> URL { root.appendingPathComponent("notes/\(id.uuidString).md") }
    private func safeExtension(_ name: String) -> String {
        let ext = URL(fileURLWithPath: name).pathExtension.lowercased()
        return !ext.isEmpty && ext.count < 12 && ext.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber) }) ? ext : "bin"
    }
    private func ensureRegularFile(_ url: URL) throws {
        let values = try url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey])
        guard values.isRegularFile == true && values.isSymbolicLink != true else { throw VaultError.unsafePath }
        let resolved = url.resolvingSymlinksInPath()
        guard resolved.path == url.standardizedFileURL.path else { throw VaultError.unsafePath }
    }
    private func validateFolders(_ entries: [Folder]) throws {
        guard Set(entries.map(\.id)).count == entries.count else { throw VaultError.invalidFolder }
        let map = Dictionary(uniqueKeysWithValues: entries.map { ($0.id, $0) })
        for folder in entries {
            guard !folder.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw VaultError.invalidFolder }
            var visited: Set<UUID> = [folder.id]; var parent = folder.parentID
            while let id = parent {
                guard visited.insert(id).inserted else { throw VaultError.folderCycle }
                guard let ancestor = map[id] else { throw VaultError.invalidFolder }
                parent = ancestor.parentID
            }
        }
    }
}

public enum AtomicFile {
    public static func write(_ data: Data, to url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        #if os(iOS)
        try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        #else
        try data.write(to: url, options: .atomic)
        #endif
    }
}
