import XCTest
@testable import MementoCore

final class MarkdownAndSearchTests: XCTestCase {
    func testPortableMarkdownRoundTrip() throws {
        let note = Note(title: "\"quoted\" 中文", body: "---\n# Text\n\n[[Another]]\n")
        let encoded = try MarkdownFile.encode(note)
        XCTAssertTrue(String(decoding: encoded, as: UTF8.self).hasSuffix(note.body))
        let decoded = try MarkdownFile.decode(encoded)
        XCTAssertEqual(decoded.id, note.id); XCTAssertEqual(decoded.title, note.title); XCTAssertEqual(decoded.body, note.body)
    }
    func testPlainMarkdownImportAndBadMetadata() throws {
        let note = try MarkdownFile.decode(Data("# Title\nBody".utf8))
        XCTAssertEqual(note.title, "Title"); XCTAssertEqual(note.body, "# Title\nBody")
        XCTAssertThrowsError(try MarkdownFile.decode(Data("---\nmemento: {}\n---\nsecret".utf8)))
    }
    func testUTF16FormattingAndSelection() {
        let text = "你好 👨‍👩‍👧‍👦 world"
        let selection = (text as NSString).range(of: "👨‍👩‍👧‍👦")
        let edit = MarkdownEditing.edit(.bold, text: text, selection: selection)
        XCTAssertEqual(edit.applying(to: text), "你好 **👨‍👩‍👧‍👦** world")
        XCTAssertEqual(edit.selection.length, selection.length)
        XCTAssertEqual((edit.applying(to: text) as NSString).substring(with: edit.selection), "👨‍👩‍👧‍👦")
        let undoFormat = MarkdownEditing.edit(.bold, text: edit.applying(to: text), selection: edit.selection)
        XCTAssertEqual(undoFormat.applying(to: edit.applying(to: text)), text)
    }
    func testFormattingAllCommandsAndClampedSelection() {
        for command in MarkdownCommand.allCases {
            let edit = MarkdownEditing.edit(command, text: "Hello", selection: NSRange(location: 99, length: 50))
            let result = edit.applying(to: "Hello") as NSString
            XCTAssertLessThanOrEqual(edit.selection.location + edit.selection.length, result.length)
        }
    }
    func testPrefixOperatesOnWholeLine() {
        let edit = MarkdownEditing.edit(.checklist, text: "One\nTwo\n", selection: NSRange(location: 4, length: 3))
        XCTAssertEqual(edit.applying(to: "One\nTwo\n"), "One\n- [ ] Two\n")
    }
    func testHeadingReplacementAndChecklistToggle() {
        let heading = MarkdownEditing.edit(.h2, text: "# Title", selection: NSRange(location: 7, length: 0))
        XCTAssertEqual(heading.applying(to: "# Title"), "## Title")
        XCTAssertEqual(heading.selection.location, 8)
        let checked = MarkdownEditing.edit(.checklist, text: "- [ ] Task", selection: NSRange(location: 10, length: 0))
        XCTAssertEqual(checked.applying(to: "- [ ] Task"), "Task")
        XCTAssertEqual(checked.selection.location, 4)
    }
    func testCodeExamplesDoNotProduceBacklinks() {
        XCTAssertEqual(WikiLinks.targets(in: "[[Real]]\n```\n[[Example]]\n```\n`[[Inline]]`"), ["Real"])
    }
    func testTablesAreSingleStructuredBlock() {
        let blocks = MarkdownDocument.parse("| A | B |\n| --- | --- |\n| 1 | 2 |")
        XCTAssertEqual(blocks.count, 1); XCTAssertEqual(blocks.first?.kind, .table)
    }
    func testStructuredDocumentDoesNotDropUnclosedCode() {
        let blocks = MarkdownDocument.parse("# Title\n- [ ] Task\n- [x] Done\n> Quote\n```swift\nlet x = 1")
        XCTAssertEqual(blocks.count, 5)
        XCTAssertEqual(blocks[1].kind, .checklist(false)); XCTAssertEqual(blocks[2].kind, .checklist(true))
        XCTAssertEqual(blocks.last?.kind, .code("swift")); XCTAssertEqual(blocks.last?.text, "let x = 1")
    }
    func testSearchRanksTitleAndFindsChineseBody() {
        let title = Note(title: "Café", body: "writing")
        let body = Note(title: "Other", body: "A cafe in 北京")
        XCTAssertEqual(NoteSearch.search([body, title], query: "cafe").first?.id, title.id)
        XCTAssertEqual(NoteSearch.search([body, title], query: "北京").first?.id, body.id)
        XCTAssertTrue(NoteSearch.search([body], query: "cafe missing").isEmpty)
    }
    func testScopesExcludeArchiveAndTrash() {
        var pin = Note(title: "Pin"); pin.isPinned = true
        var archived = Note(title: "Archive"); archived.isArchived = true
        var deleted = Note(title: "Trash"); deleted.deletedAt = Date()
        let notes = [pin, archived, deleted]
        XCTAssertEqual(NoteSearch.search(notes, query: "").count, 1)
        XCTAssertEqual(NoteSearch.search(notes, query: "", scope: .pinned).first?.id, pin.id)
        XCTAssertEqual(NoteSearch.search(notes, query: "", scope: .archived).first?.id, archived.id)
        XCTAssertEqual(NoteSearch.search(notes, query: "", scope: .deleted).first?.id, deleted.id)
    }
    func testWikiLinkAliasDedupAndBacklinks() {
        let target = Note(title: "Daily")
        let source = Note(title: "Source", body: "[[Daily|Today]] [[daily]] [[ 中文 ]] [[ ]]")
        XCTAssertEqual(source.wikiLinks, ["Daily", "中文"])
        XCTAssertEqual(WikiLinks.backlinks(to: target, in: [target, source]).map(\.id), [source.id])
    }
    func testTenThousandNotesSearchBenchmark() {
        let notes = (0..<10_000).map { Note(title: "Note \($0)", body: "中文 writing content \($0)") }
        measure { XCTAssertEqual(NoteSearch.search(notes, query: "content 9999").count, 1) }
    }
}
