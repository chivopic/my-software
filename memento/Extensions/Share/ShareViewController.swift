import UIKit
import UniformTypeIdentifiers
import MementoCore

/// The share extension only publishes inbox jobs. It never writes an existing note or vault catalog.
final class ShareViewController: UIViewController {
    private let titleField = UITextField()
    private let bodyView = UITextView()
    private let status = UILabel()
    private let saveButton = UIButton(type: .system)
    private var files: [CaptureFile] = []
    private var loaded = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        titleField.placeholder = "Note title"; titleField.font = .preferredFont(forTextStyle: .headline)
        titleField.adjustsFontForContentSizeCategory = true
        bodyView.font = .preferredFont(forTextStyle: .body); bodyView.adjustsFontForContentSizeCategory = true
        bodyView.accessibilityLabel = "Captured text"
        status.font = .preferredFont(forTextStyle: .footnote); status.textColor = .secondaryLabel; status.numberOfLines = 0
        saveButton.setTitle("Save to Memento", for: .normal); saveButton.isEnabled = false
        saveButton.addAction(UIAction { [weak self] _ in self?.save() }, for: .touchUpInside)
        let cancel = UIButton(type: .system); cancel.setTitle("Cancel", for: .normal)
        cancel.addAction(UIAction { [weak self] _ in self?.extensionContext?.completeRequest(returningItems: nil) }, for: .touchUpInside)
        let header = UILabel(); header.text = "Memento"; header.font = .preferredFont(forTextStyle: .largeTitle)
        let stack = UIStackView(arrangedSubviews: [header, titleField, bodyView, status, saveButton, cancel])
        stack.axis = .vertical; stack.spacing = 16; stack.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24),
            stack.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor, constant: -12),
            bodyView.heightAnchor.constraint(greaterThanOrEqualToConstant: 120),
            saveButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            cancel.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])
        Task { await loadSharedItems() }
    }

    @MainActor private func loadSharedItems() async {
        do {
            guard try !SharedContainer.isLocked(at: SharedContainer.root()) else {
                status.text = "Memento is locked. Open and unlock the app before sharing."; return
            }
            var pieces: [String] = []
            for case let item as NSExtensionItem in extensionContext?.inputItems ?? [] {
                for provider in item.attachments ?? [] {
                    if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                        let value = try await loadItem(provider, type: UTType.url.identifier)
                        if let url = value as? URL {
                            if url.isFileURL {
                                let scoped = url.startAccessingSecurityScopedResource()
                                defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                                let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                                guard size <= 25 * 1024 * 1024 else { throw VaultError.oversizedAttachment }
                                let data = try await Task.detached { try Data(contentsOf: url) }.value
                                let image = UTType(filenameExtension: url.pathExtension)?.conforms(to: .image) == true
                                files.append(CaptureFile(name: url.lastPathComponent, data: data, isImage: image))
                            } else { pieces.append(url.absoluteString) }
                        }
                        else { throw CocoaError(.fileReadCorruptFile) }
                    } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                        let value = try await loadItem(provider, type: UTType.plainText.identifier)
                        if let text = value as? String { pieces.append(text) }
                        else if let data = value as? Data, let text = String(data: data, encoding: .utf8) { pieces.append(text) }
                        else { throw CocoaError(.fileReadCorruptFile) }
                    } else if let identifier = provider.registeredTypeIdentifiers.first(where: { UTType($0)?.conforms(to: .image) == true || UTType($0)?.conforms(to: .data) == true }) {
                        let data = try await loadData(provider, type: identifier)
                        guard data.count <= 25 * 1024 * 1024 else { throw VaultError.oversizedAttachment }
                        let type = UTType(identifier)
                        files.append(CaptureFile(name: (provider.suggestedName ?? "Attachment") + "." + (type?.preferredFilenameExtension ?? "bin"),
                                                 data: data, isImage: type?.conforms(to: .image) == true))
                    } else { throw CocoaError(.featureUnsupported) }
                }
            }
            bodyView.text = pieces.joined(separator: "\n\n")
            guard !pieces.isEmpty || !files.isEmpty else { throw CocoaError(.fileReadUnknown) }
            status.text = files.isEmpty ? "Saved locally. No network connection needed." : "\(files.count) attachments will be included."
            loaded = true; saveButton.isEnabled = true
        } catch { status.text = error.localizedDescription }
    }

    private func save() {
        guard loaded else { return }
        saveButton.isEnabled = false
        let capture = Capture(title: titleField.text ?? "", body: bodyView.text)
        let files = files
        Task {
            do {
                let root = try SharedContainer.root()
                try await Task.detached { try SharedContainer.enqueue(capture, files: files, at: root) }.value
                extensionContext?.completeRequest(returningItems: nil)
            } catch { status.text = error.localizedDescription; saveButton.isEnabled = true }
        }
    }

    private func loadItem(_ provider: NSItemProvider, type: String) async throws -> NSSecureCoding {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: type, options: nil) { item, error in
                if let error { continuation.resume(throwing: error) }
                else if let item { continuation.resume(returning: item) }
                else { continuation.resume(throwing: CocoaError(.fileReadUnknown)) }
            }
        }
    }
    private func loadData(_ provider: NSItemProvider, type: String) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadDataRepresentation(forTypeIdentifier: type) { data, error in
                if let error { continuation.resume(throwing: error) }
                else if let data { continuation.resume(returning: data) }
                else { continuation.resume(throwing: CocoaError(.fileReadUnknown)) }
            }
        }
    }
}
