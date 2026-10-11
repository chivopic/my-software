import MementoCore
import Observation

@MainActor @Observable
final class EditorSession {
    private var version = 0
    @ObservationIgnored let draft: NoteDraft
    var note: Note { get { _ = version; return draft.note } set { draft.note = newValue } }
    var status: String { _ = version; return draft.status }
    var failure: String? { _ = version; return draft.failure }

    init(note: Note, library: Library) {
        draft = library.pendingDrafts[note.id] ?? NoteDraft(note: note, persist: { [weak library] note in
            guard let library else { throw VaultError.missingNote }
            return try await library.save(note)
        }, recover: { [weak library] draft in
            guard let library else { throw VaultError.missingNote }
            guard let vault = library.vault else { throw VaultError.missingNote }
            let copy = try await vault.create(title: draft.displayTitle + " (Recovered)", body: draft.body)
            var complete = copy; complete.tags = draft.tags; complete.attachments = draft.attachments
            let saved = try await vault.save(complete, expectedRevision: copy.revision)
            await library.refresh(); library.releaseDraft(draft.id); library.selection = saved.id
            return saved
        })
        let model = draft
        draft.onStateChange = { [weak self, weak library, weak model] in
            self?.version += 1
            guard let model, let library else { return }
            if model.hasUnsavedChanges { library.retainDraft(model) }
            else { library.releaseDraft(model.note.id) }
        }
    }
    func changed() { draft.changed() }
    func flush() async { await draft.flush() }
    func saveCopy() async { await draft.saveCopy() }
}
