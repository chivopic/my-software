import XCTest

final class MementoUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--reset-ui-tests"]
        app.launch()
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }

    private func create(title: String, body: String) {
        let button = app.buttons["new-note"]
        XCTAssertTrue(button.waitForExistence(timeout: 10)); button.tap()
        let titleField = app.textFields["note-title"]
        // axis: .vertical TextField may expose itself as a text view on some SDKs.
        let field = titleField.exists ? titleField : app.textViews["note-title"]
        XCTAssertTrue(field.waitForExistence(timeout: 5)); field.tap(); field.typeText(title)
        let editor = app.textViews["note-body"]
        editor.tap(); editor.typeText(body)
        let saved = app.staticTexts["save-status"]
        let predicate = NSPredicate(format: "label == %@", "Saved on device")
        expectation(for: predicate, evaluatedWith: saved)
        waitForExpectations(timeout: 10)
    }

    func testPersistenceAfterTerminationAndPreview() {
        capture("01-notes-home")
        create(title: "Persisted thought", body: "# A heading\n- [ ] A real task\n**Words worth keeping**")
        capture("02-editor-keyboard")
        app.buttons["toggle-preview"].tap()
        XCTAssertTrue(app.staticTexts["Words worth keeping"].waitForExistence(timeout: 5))
        capture("03-markdown-preview")
        app.terminate(); app.launchArguments = ["--uitesting"]; app.launch()
        let row = app.cells.containing(.staticText, identifier: "Persisted thought").firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 10)); row.tap()
        XCTAssertTrue(app.textViews["note-body"].value as? String == "# A heading\n- [ ] A real task\n**Words worth keeping**")
    }

    func testDeleteAndUndoRestoresNote() {
        create(title: "Recoverable", body: "Do not lose this")
        // End text editing before using the navigation toolbar.
        app.buttons["toggle-preview"].tap()
        let actions = app.buttons["note-actions"]
        XCTAssertTrue(actions.waitForExistence(timeout: 5))
        if actions.isHittable {
            actions.tap()
        } else {
            // XCTest sometimes cannot AX-scroll a visible SwiftUI toolbar Menu.
            // Only use its actual on-screen center, never a hard-coded coordinate.
            let center = CGPoint(x: actions.frame.midX, y: actions.frame.midY)
            XCTAssertTrue(app.frame.contains(center), "Note Actions must be on screen")
            actions.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
        let deleteAction = app.buttons["Delete Note"]
        XCTAssertTrue(deleteAction.waitForExistence(timeout: 5))
        deleteAction.tap()
        app.sheets.buttons["Delete Note"].tap()
        let undo = app.buttons["Undo"]
        XCTAssertTrue(undo.waitForExistence(timeout: 5)); undo.tap()
        XCTAssertTrue(app.cells.containing(.staticText, identifier: "Recoverable").firstMatch.waitForExistence(timeout: 5))
    }

    func testSearchReturnsMatchingBodyAndKeepsEditorContent() {
        create(title: "Searchable thought", body: "A distinctive sentence worth keeping.")
        app.navigationBars.buttons["Notes"].tap()
        let search = app.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 5)); search.tap(); search.typeText("distinctive")
        let row = app.cells.containing(.staticText, identifier: "Searchable thought").firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5)); capture("04-search")
        row.tap()
        XCTAssertTrue((app.textViews["note-body"].value as? String)?.contains("distinctive") == true)
    }

    func testDarkAppearanceScreenshots() {
        app.terminate()
        app.launchArguments = ["--uitesting", "--reset-ui-tests", "--dark-appearance"]
        app.launch(); XCTAssertTrue(app.buttons["new-note"].waitForExistence(timeout: 10))
        capture("07-dark-home")
        create(title: "Night writing", body: "# A quiet page\nWords after sunset.")
        capture("08-dark-editor")
        app.buttons["toggle-preview"].tap(); capture("09-dark-preview")
    }

    func testSettingsAndOrganizationScreenshots() {
        app.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
        let dataHeader = app.staticTexts["settings-data-header"]
        for _ in 0..<4 {
            if dataHeader.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(dataHeader.isHittable, "The Your Data section must be reachable by scrolling")
        capture("05-settings")
        app.buttons["Done"].tap()
        app.buttons["library-sidebar"].tap()
        capture("06-organization")
        XCTAssertTrue(app.navigationBars["Library"].waitForExistence(timeout: 5), "Library sidebar should open")
        let newFolder = app.buttons["new-folder"]
        XCTAssertTrue(newFolder.waitForExistence(timeout: 5), "New Folder should be accessible in the sidebar")
        newFolder.tap()
        let name = app.textFields["Folder Name"]; name.tap(); name.typeText("Work")
        app.buttons["Save"].tap()
        XCTAssertTrue(app.staticTexts["Work"].waitForExistence(timeout: 5))
    }
}
