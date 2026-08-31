#if canImport(AppKit)
import AppKit

@MainActor
final class MainWindowController: NSWindowController {
    private let store: VaultStore
    private let sidebar = SidebarViewController()
    private let list = NoteListViewController()
    private let editor = EditorViewController()

    init(store: VaultStore) {
        self.store = store
        let split = NSSplitViewController()
        split.addSplitViewItem(NSSplitViewItem(sidebarWithViewController: sidebar))
        split.addSplitViewItem(NSSplitViewItem(viewController: list))
        split.addSplitViewItem(NSSplitViewItem(viewController: editor))
        sidebar.preferredContentSize.width = 220
        list.preferredContentSize.width = 300

        let window = NSWindow(contentViewController: split)
        window.title = "VOOC"
        window.setContentSize(NSSize(width: 1260, height: 780))
        window.minSize = NSSize(width: 920, height: 600)
        window.center()
        window.titlebarAppearsTransparent = true
        window.styleMask.insert(.fullSizeContentView)
        super.init(window: window)

        sidebar.onOpenVault = { [weak self] in self?.openVault(nil) }
        sidebar.onNewNote = { [weak self] in self?.newNote(nil) }
        list.onSelection = { [weak self] note in self?.show(note) }
        list.onQueryChange = { [weak self] query in self?.filter(query) }
        editor.onSave = { [weak self] note, content in self?.save(note, content: content) }
    }

    required init?(coder: NSCoder) { nil }

    @objc func openVault(_ sender: Any?) {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Open Vault"
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do {
            try store.open(url)
            sidebar.setVaultName(url.lastPathComponent)
            list.setNotes(store.notes)
            if let first = store.notes.first { list.select(first); show(first) }
        } catch { present(error) }
    }

    @objc func newNote(_ sender: Any?) {
        do {
            let note = try store.createNote()
            list.setNotes(store.notes)
            list.select(note)
            show(note)
        } catch { present(error) }
    }

    @objc func focusSearch(_ sender: Any?) { list.focusSearch() }

    private func filter(_ query: String) { list.setNotes(store.filteredNotes(query: query)) }

    private func show(_ note: Note) {
        do { editor.display(note: note, content: try store.content(for: note)) }
        catch { present(error) }
    }

    private func save(_ note: Note, content: String) {
        do {
            try store.save(content, for: note)
            editor.showSaved()
            list.setNotes(store.notes)
        } catch {
            editor.showSaveError(error.localizedDescription)
        }
    }

    private func present(_ error: Error) {
        let alert = NSAlert(error: error)
        alert.beginSheetModal(for: window!)
    }
}
#endif
