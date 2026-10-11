import Foundation

public struct Capture: Codable, Sendable {
    public var id: UUID
    public var title: String
    public var body: String
    public var attachments: [Attachment]
    public init(id: UUID = UUID(), title: String, body: String, attachments: [Attachment] = []) {
        self.id = id; self.title = title; self.body = body; self.attachments = attachments
    }
}

public struct CaptureFile: Sendable {
    public var name: String
    public var data: Data
    public var isImage: Bool
    public init(name: String, data: Data, isImage: Bool) { self.name = name; self.data = data; self.isImage = isImage }
}

public struct PrivacyState: Codable, Sendable {
    public var lockEnabled: Bool
    public init(lockEnabled: Bool) { self.lockEnabled = lockEnabled }
}
public struct WidgetNote: Codable, Identifiable, Sendable {
    public var id: UUID
    public var title: String
    public init(id: UUID, title: String) { self.id = id; self.title = title }
}
public struct WidgetSnapshot: Codable, Sendable {
    public var isPrivate: Bool
    public var notes: [WidgetNote]
    public init(isPrivate: Bool, notes: [WidgetNote]) { self.isPrivate = isPrivate; self.notes = notes }
}

public enum SharedContainer {
    public static let groupID = "group.com.chivopic.memento"
    public static func root() throws -> URL {
        #if os(iOS)
        guard let url = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupID) else {
            throw CocoaError(.fileNoSuchFile, userInfo: [NSLocalizedDescriptionKey: "The Memento App Group is unavailable. Check signing and entitlements."])
        }
        return url
        #else
        throw CocoaError(.featureUnsupported)
        #endif
    }
    public static func isLocked(at root: URL) throws -> Bool {
        let file = root.appendingPathComponent("privacy.json")
        if !FileManager.default.fileExists(atPath: file.path) { return false }
        return try JSONDecoder().decode(PrivacyState.self, from: Data(contentsOf: file)).lockEnabled
    }
    /// Multiple extensions publish independent UUID directories; the manifest is written last.
    public static func enqueue(_ capture: Capture, files: [CaptureFile] = [], at root: URL) throws {
        guard try !isLocked(at: root) else {
            throw CocoaError(.fileReadNoPermission, userInfo: [NSLocalizedDescriptionKey: "Open and unlock Memento to capture content."])
        }
        let directory = root.appendingPathComponent("inbox/\(capture.id.uuidString)")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var committed = capture
        do {
            for file in files {
                guard file.data.count <= 25 * 1024 * 1024 else { throw VaultError.oversizedAttachment }
                let id = UUID()
                let proposed = URL(fileURLWithPath: file.name).pathExtension.lowercased()
                let ext = proposed.count < 12 && !proposed.isEmpty && proposed.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber) }) ? proposed : "bin"
                let attachment = Attachment(id: id, name: URL(fileURLWithPath: file.name).lastPathComponent,
                                            filename: "\(id.uuidString).\(ext)", byteCount: file.data.count, isImage: file.isImage)
                try AtomicFile.write(file.data, to: directory.appendingPathComponent(attachment.filename))
                committed.attachments.append(attachment)
            }
            try AtomicFile.write(try JSONEncoder().encode(committed), to: directory.appendingPathComponent("capture.json"))
        } catch { try? FileManager.default.removeItem(at: directory); throw error }
    }
}
