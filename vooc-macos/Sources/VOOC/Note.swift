import Foundation

struct Note: Identifiable, Hashable, Sendable {
    let url: URL
    var title: String
    var preview: String
    var modifiedAt: Date

    var id: URL { url }
}

enum NoteMetadata {
    static func title(from content: String, fallback: String) -> String {
        let firstLine = content.split(whereSeparator: \Character.isNewline).first.map(String.init) ?? ""
        let markdownTitle = firstLine.trimmingCharacters(in: .whitespaces).replacingOccurrences(
            of: "^#+\\s*",
            with: "",
            options: .regularExpression
        )
        return markdownTitle.isEmpty ? fallback : markdownTitle
    }

    static func preview(from content: String) -> String {
        content
            .replacingOccurrences(of: "[#*_>`~-]", with: "", options: .regularExpression)
            .split(whereSeparator: \Character.isWhitespace)
            .prefix(18)
            .joined(separator: " ")
    }
}
