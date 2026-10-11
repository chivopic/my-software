import SwiftUI
import UIKit
import Observation
import MementoCore

@MainActor @Observable
final class EditorCommands {
    weak var view: UITextView?
    var canUndo: Bool { view?.undoManager?.canUndo == true }
    func apply(_ command: MarkdownCommand) {
        guard let view, view.markedTextRange == nil else { return }
        view.becomeFirstResponder()
        let edit = MarkdownEditing.edit(command, text: view.text, selection: view.selectedRange)
        view.selectedRange = edit.range
        // System text insertion owns the undo transaction, text input and selection notifications.
        view.insertText(edit.replacement)
        view.selectedRange = edit.selection
        view.delegate?.textViewDidChange?(view)
        view.scrollRangeToVisible(view.selectedRange)
        DesignTokens.feedback()
    }
    func undo() { guard let view, view.markedTextRange == nil else { return }; view.undoManager?.undo(); view.delegate?.textViewDidChange?(view) }
    func redo() { guard let view, view.markedTextRange == nil else { return }; view.undoManager?.redo(); view.delegate?.textViewDidChange?(view) }
    func dismissKeyboard() { view?.resignFirstResponder() }
}

struct MarkdownTextView: UIViewRepresentable {
    @Binding var text: String
    var commands: EditorCommands
    var fontScale: Double
    var spellcheck: Bool
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    func makeUIView(context: Context) -> UITextView {
        let view = UITextView(usingTextLayoutManager: true)
        view.delegate = context.coordinator
        view.text = text
        view.backgroundColor = .systemBackground
        view.textColor = .label
        view.adjustsFontForContentSizeCategory = true
        view.textContainerInset = UIEdgeInsets(top: 12, left: DesignTokens.bodyInset, bottom: 32, right: DesignTokens.bodyInset)
        view.textContainer.lineFragmentPadding = 0
        view.keyboardDismissMode = .interactive
        view.alwaysBounceVertical = true
        view.accessibilityLabel = "Note body"
        view.accessibilityIdentifier = "note-body"
        view.smartQuotesType = .no
        view.smartDashesType = .no
        commands.view = view
        view.inputAccessoryView = context.coordinator.accessory(commands: commands)
        updateUIView(view, context: context)
        return view
    }

    func updateUIView(_ view: UITextView, context: Context) {
        context.coordinator.parent = self
        commands.view = view
        // Composition text belongs to UIKit. A SwiftUI update must never replace it.
        if view.markedTextRange == nil && view.text != text {
            let selection = view.selectedRange; let offset = view.contentOffset
            view.text = text
            let length = (text as NSString).length
            view.selectedRange = NSRange(location: min(selection.location, length), length: min(selection.length, max(0, length - selection.location)))
            view.setContentOffset(offset, animated: false)
        }
        let font = UIFont.preferredFont(forTextStyle: .body)
        let scaled = font.withSize(font.pointSize * CGFloat(fontScale))
        if view.font != scaled && view.markedTextRange == nil { view.font = scaled }
        view.spellCheckingType = spellcheck ? .yes : .no
        view.autocorrectionType = spellcheck ? .yes : .no
        view.textColor = .label
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    @MainActor final class Coordinator: NSObject, UITextViewDelegate {
        var parent: MarkdownTextView
        init(_ parent: MarkdownTextView) { self.parent = parent }
        func textViewDidChange(_ textView: UITextView) {
            // Publish only committed text; the native view continues displaying active IME composition.
            if textView.markedTextRange == nil && parent.text != textView.text { parent.text = textView.text }
        }
        func textViewDidEndEditing(_ textView: UITextView) { if parent.text != textView.text { parent.text = textView.text } }

        func accessory(commands: EditorCommands) -> UIView {
            let bar = UIView(frame: CGRect(x: 0, y: 0, width: 390, height: 48))
            bar.autoresizingMask = [.flexibleWidth]
            bar.backgroundColor = .secondarySystemBackground
            let scroll = UIScrollView(); scroll.showsHorizontalScrollIndicator = false
            scroll.translatesAutoresizingMaskIntoConstraints = false; bar.addSubview(scroll)
            let stack = UIStackView(); stack.axis = .horizontal; stack.spacing = 4
            stack.translatesAutoresizingMaskIntoConstraints = false; scroll.addSubview(stack)
            for command in [MarkdownCommand.h1, .h2, .h3, .bold, .italic, .bullet, .numbered, .checklist, .quote, .code, .codeBlock, .link, .table] {
                let button = UIButton(type: .system)
                if [.h1, .h2, .h3].contains(command) { button.setTitle(command.rawValue.uppercased(), for: .normal) }
                else { button.setImage(UIImage(systemName: command.symbol), for: .normal) }
                button.accessibilityLabel = command.label
                button.addAction(UIAction { _ in commands.apply(command) }, for: .touchUpInside)
                button.widthAnchor.constraint(equalToConstant: 44).isActive = true
                stack.addArrangedSubview(button)
            }
            for (symbol, label, action) in [
                ("arrow.uturn.backward", "Undo", { commands.undo() }),
                ("arrow.uturn.forward", "Redo", { commands.redo() }),
                ("keyboard.chevron.compact.down", "Dismiss keyboard", { commands.dismissKeyboard() })
            ] {
                let button = UIButton(type: .system); button.setImage(UIImage(systemName: symbol), for: .normal)
                button.accessibilityLabel = label; button.widthAnchor.constraint(equalToConstant: 44).isActive = true
                button.addAction(UIAction { _ in action() }, for: .touchUpInside); stack.addArrangedSubview(button)
            }
            NSLayoutConstraint.activate([
                scroll.leadingAnchor.constraint(equalTo: bar.leadingAnchor), scroll.trailingAnchor.constraint(equalTo: bar.trailingAnchor),
                scroll.topAnchor.constraint(equalTo: bar.topAnchor), scroll.bottomAnchor.constraint(equalTo: bar.bottomAnchor),
                stack.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 8),
                stack.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -8),
                stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor), stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
                stack.heightAnchor.constraint(equalTo: scroll.frameLayoutGuide.heightAnchor)
            ])
            return bar
        }
    }
}
