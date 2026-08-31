import Testing
@testable import VOOC

@Test func extractsMarkdownTitle() {
    #expect(NoteMetadata.title(from: "# A calm notebook\nBody", fallback: "Untitled") == "A calm notebook")
}

@Test func fallsBackForEmptyContent() {
    #expect(NoteMetadata.title(from: "", fallback: "File Name") == "File Name")
}

@Test func createsPlainPreview() {
    #expect(NoteMetadata.preview(from: "## Hello **connected** world") == "Hello connected world")
}
