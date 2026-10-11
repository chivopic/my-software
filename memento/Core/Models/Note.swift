import Foundation

public struct Attachment: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var name: String
    public var filename: String
    public var byteCount: Int
    public var isImage: Bool

    public init(id: UUID = UUID(), name: String, filename: String, byteCount: Int, isImage: Bool) {
        self.id = id; self.name = name; self.filename = filename
        self.byteCount = byteCount; self.isImage = isImage
    }
}

public struct Note: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var title: String
    public var body: String
    public var createdAt: Date
    public var modifiedAt: Date
    public var revision: Int
    public var folderID: UUID?
    public var tags: [String]
    public var isPinned: Bool
    public var isArchived: Bool
    public var deletedAt: Date?
    public var attachments: [Attachment]

    public init(id: UUID = UUID(), title: String = "", body: String = "", folderID: UUID? = nil) {
        self.id = id; self.title = title; self.body = body; self.folderID = folderID
        createdAt = Date(); modifiedAt = createdAt; revision = 0
        tags = []; isPinned = false; isArchived = false; deletedAt = nil; attachments = []
    }

    public var displayTitle: String { title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Untitled" : title }
    public var excerpt: String {
        String(body.prefix(360).split(whereSeparator: \.isNewline).joined(separator: " ").prefix(180))
    }
    public var wikiLinks: [String] { WikiLinks.targets(in: body) }
}

public struct Folder: Codable, Hashable, Identifiable, Sendable {
    public var id: UUID
    public var name: String
    public var parentID: UUID?
    public init(id: UUID = UUID(), name: String, parentID: UUID? = nil) {
        self.id = id; self.name = name; self.parentID = parentID
    }
}

public struct VaultSnapshot: Sendable {
    public var notes: [Note]
    public var folders: [Folder]
    public var warnings: [String]
    public init(notes: [Note], folders: [Folder], warnings: [String] = []) {
        self.notes = notes; self.folders = folders; self.warnings = warnings
    }
}

public enum VaultError: Error, LocalizedError, Equatable {
    case missingNote
    case conflict
    case invalidFolder
    case folderCycle
    case unsafePath
    case invalidMarkdown
    case unsupportedVersion
    case oversizedAttachment
    case invalidArchive
    public var errorDescription: String? {
        switch self {
        case .missingNote: "This note no longer exists."
        case .conflict: "A newer version exists. Save your draft as a copy to avoid overwriting it."
        case .invalidFolder: "The folder is missing or its name is empty."
        case .folderCycle: "A folder cannot contain itself or one of its ancestors."
        case .unsafePath: "This attachment path is not safe."
        case .invalidMarkdown: "This Memento Markdown file has invalid metadata. The original file was preserved."
        case .unsupportedVersion: "This file was created by a newer Memento version."
        case .oversizedAttachment: "Attachments must be smaller than 25 MB."
        case .invalidArchive: "This backup is incomplete or invalid."
        }
    }
}
