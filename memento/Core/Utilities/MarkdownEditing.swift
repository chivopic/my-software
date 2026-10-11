import Foundation

public enum MarkdownCommand: String, CaseIterable, Sendable {
    case h1, h2, h3, bold, italic, bullet, numbered, checklist, quote, code, codeBlock, link, table
    public var symbol: String {
        switch self {
        case .h1, .h2, .h3: "textformat.size"
        case .bold: "bold"
        case .italic: "italic"
        case .bullet: "list.bullet"
        case .numbered: "list.number"
        case .checklist: "checklist"
        case .quote: "text.quote"
        case .code, .codeBlock: "chevron.left.forwardslash.chevron.right"
        case .link: "link"
        case .table: "tablecells"
        }
    }
    public var label: String {
        switch self {
        case .h1: "Heading 1"
        case .h2: "Heading 2"
        case .h3: "Heading 3"
        case .codeBlock: "Code Block"
        default: rawValue.capitalized
        }
    }
}

public struct TextEdit: Equatable, Sendable {
    public var range: NSRange
    public var replacement: String
    public var selection: NSRange
    public func applying(to text: String) -> String { (text as NSString).replacingCharacters(in: range, with: replacement) }
}

public enum MarkdownEditing {
    /// UIKit selections and replacement lengths are UTF-16, never Swift character counts.
    public static func edit(_ command: MarkdownCommand, text: String, selection: NSRange) -> TextEdit {
        let ns = text as NSString
        let start = min(max(0, selection.location), ns.length)
        let count = min(max(0, selection.length), ns.length - start)
        let safe = NSRange(location: start, length: count)
        let selected = ns.substring(with: safe)
        let prefix: String?
        switch command {
        case .h1: prefix = "# "
        case .h2: prefix = "## "
        case .h3: prefix = "### "
        case .bullet: prefix = "- "
        case .numbered: prefix = "1. "
        case .checklist: prefix = "- [ ] "
        case .quote: prefix = "> "
        default: prefix = nil
        }
        if let prefix {
            let lineRange = ns.lineRange(for: safe)
            let lines = ns.substring(with: lineRange)
            let parts = lines.components(separatedBy: "\n")
            let nonempty = parts.filter { !$0.isEmpty }
            let remove = !nonempty.isEmpty && nonempty.allSatisfy { $0.hasPrefix(prefix) }
            let pattern = [.h1, .h2, .h3].contains(command) ? "^#{1,6} " : command == .quote ? "^> " : "^(?:- \\[[ xX]\\] |[-*+] |[0-9]+\\. )"
            let regex = try! NSRegularExpression(pattern: pattern)
            let edited = parts.enumerated().map { index, line -> String in
                if line.isEmpty && index == parts.count - 1 && index > 0 { return line }
                let plain = regex.stringByReplacingMatches(in: line, range: NSRange(location: 0, length: (line as NSString).length), withTemplate: "")
                return (remove ? "" : prefix) + plain
            }
            let replacement = edited.joined(separator: "\n")
            let delta = (edited.first?.utf16.count ?? 0) - (parts.first?.utf16.count ?? 0)
            let newStart = max(lineRange.location, start + delta)
            let newLength = count == 0 ? 0 : max(0, replacement.utf16.count - (newStart - lineRange.location) - (replacement.hasSuffix("\n") ? 1 : 0))
            return TextEdit(range: lineRange, replacement: replacement, selection: NSRange(location: newStart, length: newLength))
        }
        let opening: String; let closing: String; let placeholder: String
        switch command {
        case .bold: (opening, closing, placeholder) = ("**", "**", "text")
        case .italic: (opening, closing, placeholder) = ("*", "*", "text")
        case .code: (opening, closing, placeholder) = ("`", "`", "code")
        case .codeBlock: (opening, closing, placeholder) = ("\n```\n", "\n```\n", "code")
        case .link: (opening, closing, placeholder) = ("[", "](https://example.com)", "link text")
        case .table: (opening, closing, placeholder) = ("\n", "\n", "| Column | Column |\n| --- | --- |\n| Value | Value |")
        default: (opening, closing, placeholder) = ("", "", "")
        }
        let content = selected.isEmpty ? placeholder : selected
        if [.bold, .italic, .code].contains(command), !selected.isEmpty {
            let markerLength = opening.utf16.count
            if start >= markerLength, start + count + markerLength <= ns.length,
               ns.substring(with: NSRange(location: start - markerLength, length: markerLength)) == opening,
               ns.substring(with: NSRange(location: start + count, length: markerLength)) == closing {
                let expanded = NSRange(location: start - markerLength, length: count + markerLength * 2)
                return TextEdit(range: expanded, replacement: selected, selection: NSRange(location: expanded.location, length: count))
            }
        }
        return TextEdit(range: safe, replacement: opening + content + closing,
                        selection: NSRange(location: start + opening.utf16.count, length: content.utf16.count))
    }
}

public struct DocumentBlock: Identifiable, Equatable, Sendable {
    public enum Kind: Equatable, Sendable {
        case heading(Int), paragraph, quote, code(String), checklist(Bool), bullet, table, image
    }
    public var id: Int
    public var kind: Kind
    public var text: String
}

public enum MarkdownDocument {
    public static func parse(_ markdown: String) -> [DocumentBlock] {
        let lines = markdown.components(separatedBy: "\n")
        var blocks: [DocumentBlock] = []; var fence: String?; var code: [String] = []; var codeID = 0
        for (index, line) in lines.enumerated() {
            if line.hasPrefix("```") {
                if let language = fence {
                    blocks.append(.init(id: codeID, kind: .code(language), text: code.joined(separator: "\n")))
                    fence = nil; code = []
                } else { fence = String(line.dropFirst(3)); codeID = index }
                continue
            }
            if fence != nil { code.append(line); continue }
            if line.trimmingCharacters(in: .whitespaces).isEmpty { continue }
            let kind: DocumentBlock.Kind; let text: String
            if line.hasPrefix("### ") { kind = .heading(3); text = String(line.dropFirst(4)) }
            else if line.hasPrefix("## ") { kind = .heading(2); text = String(line.dropFirst(3)) }
            else if line.hasPrefix("# ") { kind = .heading(1); text = String(line.dropFirst(2)) }
            else if line.hasPrefix("- [ ] ") { kind = .checklist(false); text = String(line.dropFirst(6)) }
            else if line.lowercased().hasPrefix("- [x] ") { kind = .checklist(true); text = String(line.dropFirst(6)) }
            else if line.hasPrefix("> ") { kind = .quote; text = String(line.dropFirst(2)) }
            else if line.hasPrefix("- ") || line.hasPrefix("* ") { kind = .bullet; text = String(line.dropFirst(2)) }
            else if line.hasPrefix("|") {
                if let last = blocks.last, last.kind == .table {
                    blocks[blocks.count - 1].text += "\n" + line
                    continue
                }
                kind = .table; text = line
            }
            else if line.hasPrefix("![") { kind = .image; text = line }
            else { kind = .paragraph; text = line }
            blocks.append(.init(id: index, kind: kind, text: text))
        }
        if let language = fence { blocks.append(.init(id: codeID, kind: .code(language), text: code.joined(separator: "\n"))) }
        return blocks
    }
}
