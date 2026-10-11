import Foundation
import Observation
import MementoCore
import WidgetKit
import UIKit

@MainActor @Observable
final class Library {
    private(set) var notes: [Note] = []
    private(set) var folders: [Folder] = []
    private(set) var warnings: [String] = []
    private(set) var ready = false
    var error: String?
    var selection: UUID?
    var scope: NoteScope = .all
    var query = ""
    var hits: [SearchHit] = []
    var recentSearches: [String] = []
    var undoDeletedID: UUID?
    var lockEnabled: Bool
    let root: URL?
    let vault: Vault?
    private var searchTask: Task<Void, Never>?
    private var searchGeneration = 0
    @ObservationIgnored weak var activeDraft: EditorSession?
    @ObservationIgnored var pendingDrafts: [UUID: NoteDraft] = [:]
    private(set) var unsavedCount = 0

    init() {
        var location: URL?
        var initialLock = false
        var searches: [String] = []
        var bootError: String?
        do {
            let resolved: URL
            if ProcessInfo.processInfo.arguments.contains("--uitesting") {
                resolved = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask,
                                                       appropriateFor: nil, create: true).appendingPathComponent("UITestVault")
                if ProcessInfo.processInfo.arguments.contains("--reset-ui-tests"), FileManager.default.fileExists(atPath: resolved.path) {
                    try FileManager.default.removeItem(at: resolved)
                }
                if ProcessInfo.processInfo.arguments.contains("--reset-ui-tests") {
                    for key in ["appearance", "fontScale", "spellcheck", "recentSearches"] { UserDefaults.standard.removeObject(forKey: key) }
                }
                if ProcessInfo.processInfo.arguments.contains("--dark-appearance") { UserDefaults.standard.set("dark", forKey: "appearance") }
            } else { resolved = try SharedContainer.root() }
            initialLock = try SharedContainer.isLocked(at: resolved)
            if let data = UserDefaults.standard.data(forKey: "recentSearches") {
                do { searches = try JSONDecoder().decode([String].self, from: data) }
                catch { bootError = "Recent search history could not be read. Use Clear Recent Searches to reset it; your notes are unaffected." }
            }
            location = resolved.resolvingSymlinksInPath()
        } catch { bootError = error.localizedDescription }
        root = location; vault = location.map { Vault(root: $0.appendingPathComponent("vault")) }
        lockEnabled = initialLock; recentSearches = searches; error = bootError
    }

    func open() async {
        guard let vault else { return }
        do {
            let snapshot = try await vault.load()
            apply(snapshot); ready = true
            _ = try await vault.ingestInbox()
            await refresh()
        } catch { error = error.localizedDescription }
    }

    func refresh() async {
        guard let vault else { return }
        apply(await vault.snapshot())
        do { try await vault.writeWidgetSnapshot(locked: lockEnabled); WidgetCenter.shared.reloadAllTimelines() }
        catch { error = "Notes are saved, but the widget could not update: \(error.localizedDescription)" }
    }

    private func apply(_ snapshot: VaultSnapshot) {
        notes = snapshot.notes; folders = snapshot.folders; warnings = snapshot.warnings
        search()
    }

    func search() {
        searchTask?.cancel(); searchGeneration += 1
        let generation = searchGeneration; let notes = notes; let query = query; let scope = scope
        searchTask = Task {
            if !query.isEmpty { try? await Task.sleep(for: .milliseconds(100)) }
            guard !Task.isCancelled else { return }
            let results = await Task.detached(priority: .userInitiated) { NoteSearch.search(notes, query: query, scope: scope) }.value
            guard !Task.isCancelled, generation == searchGeneration else { return }
            hits = results
        }
    }

    func rememberSearch() {
        let value = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return }
        recentSearches.removeAll { NoteSearch.equivalent($0, value) }
        recentSearches.insert(value, at: 0); recentSearches = Array(recentSearches.prefix(10))
        do { UserDefaults.standard.set(try JSONEncoder().encode(recentSearches), forKey: "recentSearches") }
        catch { self.error = error.localizedDescription }
    }

    func clearSearches() { recentSearches = []; UserDefaults.standard.removeObject(forKey: "recentSearches") }

    func create() async {
        guard let vault else { return }
        do {
            let folderID: UUID? = if case .folder(let id) = scope { id } else { nil }
            let note = try await vault.create(folderID: folderID)
            scope = folderID.map(NoteScope.folder) ?? .all; query = ""
            await refresh(); selection = note.id; DesignTokens.feedback()
        } catch { self.error = error.localizedDescription }
    }

    func save(_ note: Note) async throws -> Note {
        guard let vault else { throw VaultError.missingNote }
        let saved = try await vault.save(note, expectedRevision: note.revision)
        await refresh()
        return saved
    }

    func mutate(_ note: Note, _ edit: (inout Note) -> Void) async {
        var copy = note; edit(&copy)
        do { _ = try await save(copy); DesignTokens.feedback() }
        catch { self.error = error.localizedDescription }
    }

    func delete(_ note: Note) async {
        guard let vault else { return }
        if let draft = pendingDrafts[note.id] {
            await draft.flush()
            if let failure = draft.failure { error = failure; return }
            if draft.hasUnsavedChanges { error = "This draft is still saving. Wait before deleting it."; return }
        }
        do {
            _ = try await vault.softDelete(note.id); undoDeletedID = note.id
            if selection == note.id { selection = nil }
            await refresh(); DesignTokens.feedback(.medium)
        } catch { self.error = error.localizedDescription }
    }

    func restore(_ noteID: UUID) async {
        guard let vault else { return }
        do { _ = try await vault.restore(noteID); undoDeletedID = nil; await refresh() }
        catch { self.error = error.localizedDescription }
    }

    func addFolder(name: String, parentID: UUID?) async {
        guard let vault else { return }
        do { try await vault.putFolder(Folder(name: name, parentID: parentID)); await refresh() }
        catch { self.error = error.localizedDescription }
    }

    func run(_ operation: @escaping @MainActor () async throws -> Void) {
        Task { do { try await operation(); await refresh() } catch { self.error = error.localizedDescription } }
    }

    func setLock(_ value: Bool) async throws {
        guard let vault else { throw VaultError.missingNote }
        try await vault.writePrivacy(locked: value)
        lockEnabled = value; WidgetCenter.shared.reloadAllTimelines()
    }

    func flushEditor() async throws {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        let drafts = Array(pendingDrafts.values)
        for draft in drafts {
            await draft.flush()
            if let failure = draft.failure { throw NSError(domain: "Memento.Save", code: 1, userInfo: [NSLocalizedDescriptionKey: failure]) }
            if draft.hasUnsavedChanges {
                throw NSError(domain: "Memento.Save", code: 2, userInfo: [NSLocalizedDescriptionKey: "A draft is still saving. Wait before exporting the backup."])
            }
        }
    }

    func retainDraft(_ draft: NoteDraft) {
        pendingDrafts[draft.note.id] = draft
        if unsavedCount != pendingDrafts.count { unsavedCount = pendingDrafts.count }
    }
    func releaseDraft(_ id: UUID) {
        pendingDrafts[id] = nil
        if unsavedCount != pendingDrafts.count { unsavedCount = pendingDrafts.count }
    }
}
