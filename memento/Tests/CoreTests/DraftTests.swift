import XCTest
@testable import MementoCore

@MainActor
final class DraftTests: XCTestCase {
    func testTypingDuringSaveDrainsNewestDraftWithoutOverlappingWrites() async throws {
        var persisted: [Note] = []
        var active = 0; var maximumActive = 0
        let initial = Note(title: "Draft")
        let draft = NoteDraft(note: initial, persist: { note in
            active += 1; maximumActive = max(maximumActive, active)
            try await Task.sleep(for: .milliseconds(40))
            var saved = note; saved.revision += 1; persisted.append(saved); active -= 1
            return saved
        }, recover: { $0 })
        draft.note.body = "first"; draft.changed()
        let firstFlush = Task { await draft.flush() }
        try await Task.sleep(for: .milliseconds(10))
        draft.note.body = "中文 newest 👋"; draft.changed()
        await draft.flush(); await firstFlush.value
        XCTAssertEqual(maximumActive, 1)
        XCTAssertEqual(persisted.map(\.body), ["first", "中文 newest 👋"])
        XCTAssertEqual(draft.note.revision, 2)
        XCTAssertEqual(draft.status, "Saved on device"); XCTAssertNil(draft.failure)
    }
    func testFailedSavePreservesDraftAndRetryClearsFailure() async {
        final class FailureSwitch { var fail = true }
        let condition = FailureSwitch()
        let draft = NoteDraft(note: Note(), persist: { note in
            if condition.fail { throw CocoaError(.fileWriteOutOfSpace) }
            var copy = note; copy.revision += 1; return copy
        }, recover: { $0 })
        draft.note.body = "Keep this unsaved text"; draft.changed()
        await draft.flush(); XCTAssertNotNil(draft.failure)
        XCTAssertTrue(draft.hasUnsavedChanges)
        XCTAssertEqual(draft.note.body, "Keep this unsaved text")
        condition.fail = false; await draft.flush()
        XCTAssertNil(draft.failure); XCTAssertEqual(draft.status, "Saved on device")
        XCTAssertFalse(draft.hasUnsavedChanges)
    }
    func testRecoveryCopyPreservesDraftAfterConflict() async {
        let originalID = UUID()
        let draft = NoteDraft(note: Note(id: originalID, body: "draft"), persist: { _ in throw VaultError.conflict }, recover: { note in
            var copy = note; copy.id = UUID(); copy.revision = 1; return copy
        })
        draft.changed(); await draft.flush(); XCTAssertNotNil(draft.failure)
        await draft.saveCopy()
        XCTAssertNotEqual(draft.note.id, originalID)
        XCTAssertEqual(draft.note.body, "draft"); XCTAssertNil(draft.failure)
        XCTAssertEqual(draft.status, "Recovery copy saved")
    }
    func testTypingDuringRecoveryIsSavedToTheNewCopy() async throws {
        let newID = UUID()
        var persisted: Note?
        let draft = NoteDraft(note: Note(body: "initial"), persist: { note in persisted = note; return note }, recover: { note in
            try await Task.sleep(for: .milliseconds(40))
            var copy = note; copy.id = newID; copy.revision = 1; return copy
        })
        draft.changed()
        let recovery = Task { await draft.saveCopy() }
        try await Task.sleep(for: .milliseconds(10))
        draft.note.body = "latest text"; draft.changed()
        await recovery.value
        XCTAssertEqual(persisted?.id, newID); XCTAssertEqual(persisted?.body, "latest text")
        XCTAssertEqual(draft.note.body, "latest text")
    }
}
