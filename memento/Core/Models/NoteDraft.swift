import Foundation

/// The save state machine is independent of UIKit and tested on Linux and macOS.
@MainActor
public final class NoteDraft {
    public var note: Note { didSet { onStateChange?() } }
    public private(set) var status = "Saved on device" { didSet { onStateChange?() } }
    public private(set) var failure: String? { didSet { onStateChange?() } }
    public var onStateChange: (@MainActor () -> Void)?
    public var hasUnsavedChanges: Bool { dirty }
    private var generation = 0
    private var dirty = false
    private var debounce: Task<Void, Never>?
    private var worker: Task<Void, Never>?
    private var recovering = false
    private let persist: @MainActor (Note) async throws -> Note
    private let recover: @MainActor (Note) async throws -> Note

    public init(note: Note, persist: @escaping @MainActor (Note) async throws -> Note,
                recover: @escaping @MainActor (Note) async throws -> Note) {
        self.note = note; self.persist = persist; self.recover = recover
    }
    public func changed() {
        generation += 1; dirty = true; failure = nil; status = "Editing…"
        debounce?.cancel()
        debounce = Task { [weak self] in
            do { try await Task.sleep(for: .milliseconds(450)) } catch { return }
            await self?.flush()
        }
    }
    public func flush() async {
        debounce?.cancel(); debounce = nil
        guard !recovering else { return }
        if let worker { await worker.value; return }
        guard dirty else { return }
        worker = Task { [self] in
            while dirty {
                let draft = note; let version = generation; status = "Saving…"
                do {
                    let saved = try await persist(draft)
                    note.revision = saved.revision; note.modifiedAt = saved.modifiedAt
                    failure = nil
                    if generation == version { dirty = false; status = "Saved on device" }
                } catch { failure = error.localizedDescription; status = "Not saved — retry"; break }
            }
            worker = nil
        }
        await worker?.value
    }
    public func saveCopy() async {
        guard !recovering else { return }
        recovering = true
        defer { recovering = false }
        debounce?.cancel(); debounce = nil
        if let worker { await worker.value }
        let version = generation
        do {
            let saved = try await recover(note)
            if generation == version { note = saved; dirty = false }
            else { note.id = saved.id; note.revision = saved.revision; note.createdAt = saved.createdAt; note.modifiedAt = saved.modifiedAt }
            failure = nil; status = "Recovery copy saved"
            recovering = false
            if dirty { await flush() }
        }
        catch { failure = error.localizedDescription }
    }
}
