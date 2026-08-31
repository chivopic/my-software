#if canImport(AppKit)
import AppKit

@MainActor
final class EditorViewController: NSViewController, NSTextViewDelegate {
    var onSave: ((Note, String) -> Void)?
    private var note: Note?
    private var pendingSave: DispatchWorkItem?
    private let title = NSTextField(labelWithString: "Open a Vault to begin")
    private let status = NSTextField(labelWithString: "Local Markdown · Private by default")
    private let textView = NSTextView()

    override func loadView() {
        view = NSView()
        view.wantsLayer = true
        view.layer?.backgroundColor = NSColor(red: 0.984, green: 0.973, blue: 0.945, alpha: 1).cgColor
        title.font = NSFont(name: "NewYork-Semibold", size: 30) ?? .systemFont(ofSize: 30, weight: .semibold)
        title.textColor = NSColor(red: 0.18, green: 0.16, blue: 0.14, alpha: 1)
        status.font = .systemFont(ofSize: 11)
        status.textColor = .secondaryLabelColor
        textView.font = NSFont(name: "NewYork-Regular", size: 16) ?? .systemFont(ofSize: 16)
        textView.textColor = NSColor(red: 0.18, green: 0.16, blue: 0.14, alpha: 1)
        textView.backgroundColor = .clear
        textView.isRichText = false
        textView.isAutomaticQuoteSubstitutionEnabled = false
        textView.textContainerInset = NSSize(width: 4, height: 18)
        textView.delegate = self
        let scroll = NSScrollView()
        scroll.documentView = textView
        scroll.hasVerticalScroller = true
        scroll.drawsBackground = false
        [title, status, scroll].forEach { $0.translatesAutoresizingMaskIntoConstraints = false; view.addSubview($0) }
        NSLayoutConstraint.activate([
            title.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 42), title.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 64), title.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -64),
            scroll.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 20), scroll.leadingAnchor.constraint(equalTo: title.leadingAnchor), scroll.trailingAnchor.constraint(equalTo: title.trailingAnchor), scroll.bottomAnchor.constraint(equalTo: status.topAnchor, constant: -10),
            status.leadingAnchor.constraint(equalTo: title.leadingAnchor), status.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -18),
        ])
    }

    func display(note: Note, content: String) {
        pendingSave?.cancel()
        self.note = note
        title.stringValue = note.title
        textView.string = content
        status.stringValue = "Markdown · \(note.url.lastPathComponent)"
    }

    func textDidChange(_ notification: Notification) {
        guard let note else { return }
        pendingSave?.cancel()
        status.stringValue = "Saving…"
        let content = textView.string
        let item = DispatchWorkItem { [weak self] in self?.onSave?(note, content) }
        pendingSave = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: item)
    }

    func showSaved() { status.stringValue = "Saved just now" }
    func showSaveError(_ message: String) { status.stringValue = "Could not save · \(message)" }
}
#endif
