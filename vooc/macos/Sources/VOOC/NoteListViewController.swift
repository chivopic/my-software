#if canImport(AppKit)
import AppKit

@MainActor
final class NoteListViewController: NSViewController, NSTableViewDataSource, NSTableViewDelegate, NSSearchFieldDelegate {
    var onSelection: ((Note) -> Void)?
    var onQueryChange: ((String) -> Void)?
    private var notes: [Note] = []
    private let search = NSSearchField()
    private let table = NSTableView()

    override func loadView() {
        view = NSView()
        search.placeholderString = "Search notes"
        search.delegate = self
        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("note"))
        table.addTableColumn(column)
        table.headerView = nil
        table.rowHeight = 64
        table.delegate = self
        table.dataSource = self
        table.style = .plain
        let scroll = NSScrollView()
        scroll.documentView = table
        scroll.hasVerticalScroller = true
        search.translatesAutoresizingMaskIntoConstraints = false
        scroll.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(search)
        view.addSubview(scroll)
        NSLayoutConstraint.activate([
            search.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 14), search.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12), search.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -12),
            scroll.topAnchor.constraint(equalTo: search.bottomAnchor, constant: 12), scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor), scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor), scroll.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    func setNotes(_ notes: [Note]) { self.notes = notes; table.reloadData() }
    func select(_ note: Note) { if let row = notes.firstIndex(of: note) { table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false) } }
    func focusSearch() { view.window?.makeFirstResponder(search) }
    func numberOfRows(in tableView: NSTableView) -> Int { notes.count }
    func tableViewSelectionDidChange(_ notification: Notification) { guard notes.indices.contains(table.selectedRow) else { return }; onSelection?(notes[table.selectedRow]) }
    func controlTextDidChange(_ obj: Notification) { onQueryChange?(search.stringValue) }

    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        let note = notes[row]
        let title = NSTextField(labelWithString: note.title)
        title.font = .systemFont(ofSize: 13, weight: .semibold)
        title.lineBreakMode = .byTruncatingTail
        let preview = NSTextField(labelWithString: note.preview)
        preview.font = .systemFont(ofSize: 11)
        preview.textColor = .secondaryLabelColor
        preview.lineBreakMode = .byTruncatingTail
        let stack = NSStackView(views: [title, preview])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 5
        stack.edgeInsets = NSEdgeInsets(top: 8, left: 10, bottom: 8, right: 10)
        return stack
    }
}
#endif
