import SwiftUI
import LocalAuthentication
import UniformTypeIdentifiers
import MementoCore

struct SettingsView: View {
    @Bindable var library: Library
    @AppStorage("appearance") private var appearance = Appearance.system.rawValue
    @AppStorage("fontScale") private var fontScale = 1.0
    @AppStorage("spellcheck") private var spellcheck = true
    @State private var storageBytes = 0
    @State private var importing = false
    @State private var exporting = false
    @State private var document: VaultExportDocument?
    @State private var busy = false
    @State private var status: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            Section("Appearance") {
                Picker("Theme", selection: $appearance) {
                    ForEach(Appearance.allCases) { value in Text(value.rawValue.capitalized).tag(value.rawValue) }
                }
                VStack(alignment: .leading) {
                    HStack { Text("Editor Font Size"); Spacer(); Text("\(Int(fontScale * 100))%").foregroundStyle(.secondary) }
                    Slider(value: $fontScale, in: 0.85...1.5, step: 0.05).accessibilityLabel("Editor font size")
                    Text("Dynamic Type also follows your system text size.").font(.caption).foregroundStyle(.secondary)
                }
            }
            Section("Editing") {
                Toggle("Spelling & Autocorrection", isOn: $spellcheck)
                Button("Clear Recent Searches", systemImage: "clock.arrow.circlepath") { library.clearSearches() }
            }
            Section("Privacy") {
                Toggle("Require Face ID or Passcode", isOn: Binding(get: { library.lockEnabled }, set: { value in
                    busy = true
                    Task {
                        defer { busy = false }
                        do {
                            guard try await LAContext().evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Change Memento privacy protection") else { return }
                            try await library.setLock(value)
                        } catch { library.error = error.localizedDescription }
                    }
                })).disabled(busy)
                Text("When locked, widgets hide note titles and share capture is unavailable. Notes stay on this device; there is no account, analytics or AI service. Device authentication protects app access, not an independently encrypted vault.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            Section {
                LabeledContent("Notes", value: String(library.notes.count))
                LabeledContent("Local Storage", value: ByteCountFormatter.string(fromByteCount: Int64(storageBytes), countStyle: .file))
                Button("Import Markdown or Memento Backup", systemImage: "square.and.arrow.down") { importing = true }.disabled(busy)
                Button("Export Complete Backup", systemImage: "square.and.arrow.up") { exportBackup() }.disabled(busy)
                Text("A backup contains all notes, including archive and trash, folders and attachment files. Imports add copies without overwriting existing notes. Markdown exports are readable without Memento. Backups are plaintext; store them somewhere private.")
                    .font(.footnote).foregroundStyle(.secondary)
                if let status { Text(status).font(.footnote).accessibilityIdentifier("import-status") }
                if busy { ProgressView("Working…") }
            } header: {
                Text("Your Data").accessibilityIdentifier("settings-data-header")
            }
            Section("About") {
                LabeledContent("Memento", value: "1.0")
                Text("A quiet place for your thoughts. Built for iPhone and iPad, using native text input and portable Markdown.")
            }
        }
        .navigationTitle("Settings")
        .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        .task { do { storageBytes = try await library.vault?.storageBytes() ?? 0 } catch { library.error = error.localizedDescription } }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.plainText, .mementoBackup], allowsMultipleSelection: true) { result in
            switch result {
            case .success(let urls): importFiles(urls)
            case .failure(let error): library.error = error.localizedDescription
            }
        }
        .fileExporter(isPresented: $exporting, document: document, contentType: .mementoBackup, defaultFilename: "Memento-Backup") { result in
            switch result {
            case .success: status = "Backup exported with all notes and attachments."
            case .failure(let error): library.error = error.localizedDescription
            }
            document = nil
        }
        .alert("Could Not Complete the Action", isPresented: Binding(get: { library.error != nil }, set: { if !$0 { library.error = nil } })) {
            Button("OK") { library.error = nil }
        } message: { Text(library.error ?? "") }
    }

    private func exportBackup() {
        guard let vault = library.vault else { return }
        busy = true
        Task {
            let url = FileManager.default.temporaryDirectory.resolvingSymlinksInPath().appendingPathComponent("\(UUID().uuidString).memento")
            defer { busy = false; try? FileManager.default.removeItem(at: url) }
            do {
                try await library.flushEditor()
                try await vault.exportBackup(to: url)
                document = try VaultExportDocument(url: url)
                exporting = true
            } catch { library.error = error.localizedDescription }
        }
    }
    private func importFiles(_ urls: [URL]) {
        guard let vault = library.vault else { return }
        busy = true
        Task {
            defer { busy = false }
            var count = 0
            do {
                for url in urls {
                    let scoped = url.startAccessingSecurityScopedResource()
                    defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                    if url.pathExtension.lowercased() == "memento" {
                        count += try await vault.importBackup(from: url.resolvingSymlinksInPath())
                    } else {
                        let data = try await Task.detached { try Data(contentsOf: url) }.value
                        _ = try await vault.importMarkdown(data, filename: url.lastPathComponent)
                        count += 1
                    }
                }
                status = "Imported \(count) notes. Existing notes were preserved."
                await library.refresh(); storageBytes = try await vault.storageBytes()
            } catch {
                await library.refresh()
                library.error = "Import stopped after \(count) files: \(error.localizedDescription). Check the library before retrying."
            }
        }
    }
}
