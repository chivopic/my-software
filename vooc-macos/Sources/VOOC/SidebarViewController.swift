#if canImport(AppKit)
import AppKit

@MainActor
final class SidebarViewController: NSViewController {
    var onOpenVault: (() -> Void)?
    var onNewNote: (() -> Void)?
    private let vaultLabel = NSTextField(labelWithString: "No Vault")

    override func loadView() {
        view = NSView()
        view.wantsLayer = true
        view.layer?.backgroundColor = NSColor(red: 0.914, green: 0.886, blue: 0.835, alpha: 1).cgColor

        let brand = NSTextField(labelWithString: "VOOC")
        brand.font = .systemFont(ofSize: 15, weight: .bold)
        brand.textColor = NSColor(red: 0.18, green: 0.16, blue: 0.14, alpha: 1)
        vaultLabel.font = .systemFont(ofSize: 12, weight: .medium)
        vaultLabel.textColor = .secondaryLabelColor

        let open = NSButton(title: "Open Vault…", target: self, action: #selector(openVault))
        open.bezelStyle = .recessed
        let create = NSButton(title: "New Note", target: self, action: #selector(newNote))
        create.bezelStyle = .recessed
        let stack = NSStackView(views: [brand, vaultLabel, open, create])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -16),
        ])
    }

    func setVaultName(_ name: String) { vaultLabel.stringValue = name.uppercased() }
    @objc private func openVault() { onOpenVault?() }
    @objc private func newNote() { onNewNote?() }
}
#endif
