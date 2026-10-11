import Foundation

public enum NoteScope: Hashable, Sendable {
    case all, pinned, recent, archived, deleted, folder(UUID), tag(String)
}

public struct SearchHit: Identifiable, Sendable {
    public var note: Note
    public var snippet: String
    public var score: Int
    public var id: UUID { note.id }
}

public enum NoteSearch {
    public static func search(_ notes: [Note], query: String, scope: NoteScope = .all) -> [SearchHit] {
        let terms = query.trimmingCharacters(in: .whitespacesAndNewlines).split(whereSeparator: \.isWhitespace).map(String.init)
        return notes.compactMap { note -> SearchHit? in
            switch scope {
            case .deleted: guard note.deletedAt != nil else { return nil }
            case .archived: guard note.deletedAt == nil && note.isArchived else { return nil }
            default: guard note.deletedAt == nil && !note.isArchived else { return nil }
            }
            switch scope {
            case .pinned: guard note.isPinned else { return nil }
            case .folder(let id): guard note.folderID == id else { return nil }
            case .tag(let tag): guard note.tags.contains(where: { equivalent($0, tag) }) else { return nil }
            default: break
            }
            var score = 0
            for term in terms {
                if note.title.range(of: term, options: [.caseInsensitive, .diacriticInsensitive]) != nil { score += 10 }
                else if note.body.range(of: term, options: [.caseInsensitive, .diacriticInsensitive]) != nil { score += 1 }
                else if note.tags.contains(where: { $0.localizedStandardContains(term) }) { score += 3 }
                else { return nil }
            }
            var snippet = note.excerpt
            if let term = terms.first, let range = note.body.range(of: term, options: [.caseInsensitive, .diacriticInsensitive]) {
                let start = note.body.index(range.lowerBound, offsetBy: -40, limitedBy: note.body.startIndex) ?? note.body.startIndex
                let end = note.body.index(range.upperBound, offsetBy: 100, limitedBy: note.body.endIndex) ?? note.body.endIndex
                snippet = (start != note.body.startIndex ? "…" : "") + note.body[start..<end].replacingOccurrences(of: "\n", with: " ")
            }
            return SearchHit(note: note, snippet: snippet, score: score)
        }.sorted {
            if $0.score != $1.score { return $0.score > $1.score }
            if scope != .recent, $0.note.isPinned != $1.note.isPinned { return $0.note.isPinned }
            if $0.note.modifiedAt != $1.note.modifiedAt { return $0.note.modifiedAt > $1.note.modifiedAt }
            return $0.id.uuidString < $1.id.uuidString
        }
    }
    public static func equivalent(_ lhs: String, _ rhs: String) -> Bool {
        lhs.compare(rhs, options: [.caseInsensitive, .diacriticInsensitive]) == .orderedSame
    }
}

public enum WikiLinks {
    public static func targets(in markdown: String) -> [String] {
        let regex = try! NSRegularExpression(pattern: "\\[\\[([^\\]\\n]+)\\]\\]")
        // A link inside a fenced/inline code example is content, not a relationship.
        var fenced = false
        let prose = markdown.components(separatedBy: "\n").map { line -> String in
            if line.hasPrefix("```") || line.hasPrefix("~~~") { fenced.toggle(); return "" }
            return fenced ? "" : line
        }.joined(separator: "\n")
        let code = try! NSRegularExpression(pattern: "`+[^`]*`+")
        let clean = code.stringByReplacingMatches(in: prose, range: NSRange(location: 0, length: (prose as NSString).length), withTemplate: "")
        let ns = clean as NSString
        var result: [String] = []
        for match in regex.matches(in: markdown, range: NSRange(location: 0, length: ns.length)) {
            let value = ns.substring(with: match.range(at: 1)).split(separator: "|", maxSplits: 1).first.map(String.init) ?? ""
            let title = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if !title.isEmpty && !result.contains(where: { NoteSearch.equivalent($0, title) }) { result.append(title) }
        }
        return result
    }
    public static func backlinks(to note: Note, in notes: [Note]) -> [Note] {
        notes.filter { $0.id != note.id && $0.deletedAt == nil && $0.wikiLinks.contains(where: { NoteSearch.equivalent($0, note.displayTitle) }) }
    }
}
