import SwiftUI
import LocalAuthentication
import MementoCore

@main
struct MementoApp: App {
    @State private var library = Library()
    @State private var unlocked = false
    @State private var authenticating = false
    @State private var authError: String?
    @State private var privacyCover = false
    @State private var pendingURL: URL?
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("appearance") private var appearance = Appearance.system.rawValue

    var body: some Scene {
        WindowGroup {
            ZStack {
                if library.lockEnabled && !unlocked {
                    ContentUnavailableView {
                        Label("Memento is locked", systemImage: "lock")
                    } description: {
                        Text(authError ?? "Your notes stay private until you authenticate.")
                    } actions: {
                        Button("Unlock", action: authenticate).buttonStyle(.borderedProminent).disabled(authenticating)
                    }
                } else {
                    NotesHome(library: library)
                        .task {
                            if !library.ready { await library.open() }
                            else { library.run { _ = try await library.vault?.ingestInbox() } }
                            if let url = pendingURL { pendingURL = nil; navigate(url) }
                        }
                }
                if privacyCover && library.lockEnabled {
                    Color(uiColor: .systemBackground).ignoresSafeArea()
                        .overlay { Label("Memento", systemImage: "lock").font(.title) }
                }
            }
            .preferredColorScheme((Appearance(rawValue: appearance) ?? .system).colorScheme)
            .onChange(of: scenePhase) { _, phase in
                privacyCover = phase != .active
                if phase == .background, library.lockEnabled { unlocked = false }
                if phase == .active, (!library.lockEnabled || unlocked), library.ready {
                    library.run { _ = try await library.vault?.ingestInbox() }
                }
            }
            .onChange(of: library.lockEnabled) { _, enabled in if enabled { unlocked = true } }
            .onOpenURL(perform: navigate)
        }
    }

    private func navigate(_ url: URL) {
        guard url.scheme == "memento" else { return }
        guard library.ready, !library.lockEnabled || unlocked else { pendingURL = url; return }
        if url.host == "new" { Task { await library.create() } }
        else if url.host == "note", let id = UUID(uuidString: url.lastPathComponent) { library.selection = id }
    }

    private func authenticate() {
        guard !authenticating else { return }
        authenticating = true; authError = nil
        Task { @MainActor in
            do {
                let success = try await LAContext().evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock your Memento notes")
                if success { unlocked = true }
            } catch { authError = error.localizedDescription }
            authenticating = false
        }
    }
}
