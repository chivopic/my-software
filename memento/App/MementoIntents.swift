import AppIntents
import MementoCore

struct CaptureNoteIntent: AppIntent {
    static var title: LocalizedStringResource = "Capture a Memento Note"
    static var description = IntentDescription("Save text to Memento on this device. Open Memento to see the captured note.")
    static var openAppWhenRun = false
    @Parameter(title: "Title") var title: String
    @Parameter(title: "Text") var text: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let root = try SharedContainer.root()
        let capture = Capture(title: title, body: text)
        try SharedContainer.enqueue(capture, at: root)
        return .result(dialog: "Captured on this device. Open Memento to add it to your library.")
    }
}

struct MementoShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: CaptureNoteIntent(), phrases: ["Capture a note in \(.applicationName)"],
                    shortTitle: "Capture Note", systemImageName: "square.and.pencil")
    }
}
