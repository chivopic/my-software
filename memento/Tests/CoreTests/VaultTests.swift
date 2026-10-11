import XCTest
@testable import MementoCore

final class VaultTests: XCTestCase, @unchecked Sendable {
    private func workspace() throws -> URL {
        let root = FileManager.default.temporaryDirectory.resolvingSymlinksInPath().appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        addTeardownBlock { try FileManager.default.removeItem(at: root) }
        return root
    }

    func testRestartPreservesMarkdownMetadataAndRecovery() async throws {
        let root = try workspace().appendingPathComponent("vault")
        let vault = Vault(root: root); _ = try await vault.load()
        var note = try await vault.create(title: "中文 📝", body: "# 标题\n\n你好 **world**\n")
        note.tags = [" Swift ", "swift", "写作"]; note.isPinned = true
        note = try await vault.save(note, expectedRevision: note.revision)
        _ = try await vault.softDelete(note.id)
        let restarted = Vault(root: root); let snapshot = try await restarted.load()
        XCTAssertEqual(snapshot.notes.count, 1)
        XCTAssertEqual(snapshot.notes[0].body, note.body)
        XCTAssertNotNil(snapshot.notes[0].deletedAt)
        let restored = try await restarted.restore(note.id)
        XCTAssertNil(restored.deletedAt); XCTAssertTrue(restored.isPinned)
        XCTAssertEqual(restored.tags, ["swift", "写作"])
    }

    func testStaleSaveCannotOverwriteNewRevision() async throws {
        let vault = Vault(root: try workspace()); _ = try await vault.load()
        let first = try await vault.create(title: "original")
        var newer = first; newer.body = "new content"
        _ = try await vault.save(newer, expectedRevision: first.revision)
        var stale = first; stale.body = "stale"
        do { _ = try await vault.save(stale, expectedRevision: first.revision); XCTFail("Expected conflict") }
        catch { XCTAssertEqual(error as? VaultError, .conflict) }
        let snapshot = await vault.snapshot()
        XCTAssertEqual(snapshot.notes.first?.body, "new content")
    }

    func testConcurrentSavesHaveExactlyOneWinner() async throws {
        let vault = Vault(root: try workspace()); _ = try await vault.load()
        let note = try await vault.create()
        let wins = await withTaskGroup(of: Bool.self) { group in
            for n in 0..<20 {
                group.addTask {
                    var draft = note; draft.body = "\(n)"
                    do { _ = try await vault.save(draft, expectedRevision: note.revision); return true }
                    catch { return false }
                }
            }
            var count = 0; for await success in group where success { count += 1 }; return count
        }
        XCTAssertEqual(wins, 1)
    }

    func testNestedFolderValidationAndRemoval() async throws {
        let vault = Vault(root: try workspace()); _ = try await vault.load()
        var a = Folder(name: "Parent"); let b = Folder(name: "Child", parentID: a.id)
        try await vault.putFolder(a); try await vault.putFolder(b)
        a.parentID = b.id
        do { try await vault.putFolder(a); XCTFail("Expected cycle") }
        catch { XCTAssertEqual(error as? VaultError, .folderCycle) }
        let note = try await vault.create(folderID: b.id)
        try await vault.removeFolder(b.id)
        let snapshot = await vault.snapshot()
        XCTAssertEqual(snapshot.notes.first(where: { $0.id == note.id })?.folderID, a.id)
    }

    func testBackupPreservesAttachmentsAndAddsWithoutOverwrite() async throws {
        let directory = try workspace()
        let vault = Vault(root: directory.appendingPathComponent("vault")); _ = try await vault.load()
        let folder = Folder(name: "Work"); try await vault.putFolder(folder)
        let note = try await vault.create(title: "A", body: "body", folderID: folder.id)
        let attached = try await vault.addAttachment(to: note.id, data: Data([1, 2, 3]), name: "photo.png", isImage: true)
        let backup = directory.appendingPathComponent("backup.memento")
        try await vault.exportBackup(to: backup)
        let count = try await vault.importBackup(from: backup)
        XCTAssertEqual(count, 1)
        let snapshot = await vault.snapshot()
        XCTAssertEqual(snapshot.notes.count, 2)
        let imported = try XCTUnwrap(snapshot.notes.first(where: { $0.id != note.id }))
        XCTAssertNotEqual(imported.attachments[0].filename, attached.attachments[0].filename)
        let file = try await vault.attachmentURL(imported.attachments[0])
        XCTAssertEqual(try Data(contentsOf: file), Data([1, 2, 3]))
        XCTAssertTrue(imported.body.contains(imported.attachments[0].filename))
        XCTAssertNotEqual(imported.folderID, folder.id)
    }

    func testInvalidBackupDoesNotChangeVault() async throws {
        let root = try workspace(); let vault = Vault(root: root.appendingPathComponent("vault")); _ = try await vault.load()
        let note = try await vault.create(title: "Keep me")
        let backup = root.appendingPathComponent("backup")
        try await vault.exportBackup(to: backup)
        try Data("corrupt".utf8).write(to: backup.appendingPathComponent("notes/\(note.id.uuidString).md"))
        // Plain Markdown is accepted for import, but a backup must keep matching canonical filenames.
        try FileManager.default.removeItem(at: backup.appendingPathComponent("manifest.txt"))
        do { _ = try await vault.importBackup(from: backup); XCTFail("Expected failure") } catch { }
        let snapshot = await vault.snapshot(); XCTAssertEqual(snapshot.notes.count, 1)
    }

    func testCorruptFileIsReportedAndNotDiscarded() async throws {
        let root = try workspace(); let vault = Vault(root: root); _ = try await vault.load()
        let url = root.appendingPathComponent("notes/\(UUID().uuidString).md")
        try Data("---\nmemento: invalid\n---\nimportant text".utf8).write(to: url)
        let snapshot = try await vault.load()
        XCTAssertEqual(snapshot.warnings.count, 1)
        XCTAssertTrue(FileManager.default.fileExists(atPath: url.path))
        do { try await vault.exportBackup(to: root.appendingPathComponent("incomplete.memento")); XCTFail("Incomplete backups must not look complete") } catch { }
    }

    func testUnsafeAttachmentAndSymlinkAreRejected() async throws {
        let root = try workspace(); let vault = Vault(root: root); _ = try await vault.load()
        let attachment = Attachment(name: "bad", filename: "../outside", byteCount: 0, isImage: false)
        do { _ = try await vault.attachmentURL(attachment); XCTFail("Expected unsafe path") }
        catch { XCTAssertEqual(error as? VaultError, .unsafePath) }
        let outside = root.appendingPathComponent("private.txt"); try Data("private".utf8).write(to: outside)
        try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("attachments/link.txt"), withDestinationURL: outside)
        do { _ = try await vault.attachmentURL(Attachment(name: "link", filename: "link.txt", byteCount: 7, isImage: false)); XCTFail("Expected symlink rejection") }
        catch { XCTAssertEqual(error as? VaultError, .unsafePath) }
    }

    func testPermanentDeletionRequiresTrash() async throws {
        let vault = Vault(root: try workspace()); _ = try await vault.load()
        let note = try await vault.create()
        do { try await vault.permanentlyDelete(note.id); XCTFail("Expected guard") } catch { }
        _ = try await vault.softDelete(note.id); try await vault.permanentlyDelete(note.id)
        let snapshot = await vault.snapshot(); XCTAssertTrue(snapshot.notes.isEmpty)
    }

    func testCaptureDedupAndPrivacy() async throws {
        let root = try workspace(); let vault = Vault(root: root.appendingPathComponent("vault")); _ = try await vault.load()
        let capture = Capture(title: "Shared", body: "https://example.com")
        try SharedContainer.enqueue(capture, files: [CaptureFile(name: "x.png", data: Data([1]), isImage: true)], at: root)
        let firstCount = try await vault.ingestInbox(); XCTAssertEqual(firstCount, 1)
        try SharedContainer.enqueue(capture, at: root)
        let secondCount = try await vault.ingestInbox(); XCTAssertEqual(secondCount, 0)
        try await vault.writePrivacy(locked: true)
        XCTAssertTrue(try SharedContainer.isLocked(at: root))
        let snapshot = try JSONDecoder().decode(WidgetSnapshot.self, from: Data(contentsOf: root.appendingPathComponent("widget.json")))
        XCTAssertTrue(snapshot.isPrivate); XCTAssertTrue(snapshot.notes.isEmpty)
        do { try SharedContainer.enqueue(Capture(title: "blocked", body: ""), at: root); XCTFail("Expected locked capture rejection") } catch { }
    }
}
