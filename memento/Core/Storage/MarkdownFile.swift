import Foundation

/// JSON is a valid YAML flow mapping. The body remains editable in any Markdown application.
public enum MarkdownFile {
    private struct Header: Codable {
        var version: Int
        var note: Note
    }
    public static func encode(_ note: Note) throws -> Data {
        var metadata = note
        metadata.body = ""
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        encoder.dateEncodingStrategy = .iso8601
        let json = String(decoding: try encoder.encode(Header(version: 1, note: metadata)), as: UTF8.self)
        return Data("---\nmemento: \(json)\n---\n\(note.body)".utf8)
    }

    public static func decode(_ data: Data, fallbackTitle: String = "Imported Note") throws -> Note {
        guard let text = String(data: data, encoding: .utf8) else { throw VaultError.invalidMarkdown }
        let marker = "---\nmemento: "
        guard text.hasPrefix(marker) else {
            let title = text.split(separator: "\n").first.flatMap { line -> String? in
                line.hasPrefix("# ") ? String(line.dropFirst(2)) : nil
            } ?? fallbackTitle
            return Note(title: title, body: text)
        }
        guard let end = text.range(of: "\n---\n", range: text.index(text.startIndex, offsetBy: marker.count)..<text.endIndex) else {
            throw VaultError.invalidMarkdown
        }
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        let headerData = Data(text[text.index(text.startIndex, offsetBy: marker.count)..<end.lowerBound].utf8)
        let header: Header
        do { header = try decoder.decode(Header.self, from: headerData) }
        catch { throw VaultError.invalidMarkdown }
        guard header.version == 1 else { throw VaultError.unsupportedVersion }
        var note = header.note
        note.body = String(text[end.upperBound...])
        return note
    }
}
