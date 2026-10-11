import SwiftUI
import UniformTypeIdentifiers
import MementoCore

extension UTType {
    static let mementoBackup = UTType(exportedAs: "com.chivopic.memento.vault", conformingTo: .package)
}

struct MarkdownExportDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.plainText] }
    var data: Data
    init(note: Note) throws { data = try MarkdownFile.encode(note) }
    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else { throw VaultError.invalidMarkdown }
        self.data = data
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

struct VaultExportDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.mementoBackup] }
    var wrapper: FileWrapper
    init(url: URL) throws { wrapper = try FileWrapper(url: url, options: .immediate) }
    init(configuration: ReadConfiguration) throws { wrapper = configuration.file }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { wrapper }
}
