import SwiftUI
import WidgetKit
import MementoCore

struct MementoEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

struct MementoProvider: TimelineProvider {
    func placeholder(in context: Context) -> MementoEntry {
        MementoEntry(date: .now, snapshot: WidgetSnapshot(isPrivate: true, notes: []))
    }
    func getSnapshot(in context: Context, completion: @escaping (MementoEntry) -> Void) { completion(read()) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MementoEntry>) -> Void) {
        completion(Timeline(entries: [read()], policy: .after(Date().addingTimeInterval(15 * 60))))
    }
    private func read() -> MementoEntry {
        do {
            let root = try SharedContainer.root()
            guard try !SharedContainer.isLocked(at: root) else { return placeholderEntry() }
            let snapshot = try JSONDecoder().decode(WidgetSnapshot.self, from: Data(contentsOf: root.appendingPathComponent("widget.json")))
            return MementoEntry(date: .now, snapshot: snapshot)
        } catch { return placeholderEntry() }
    }
    private func placeholderEntry() -> MementoEntry { MementoEntry(date: .now, snapshot: WidgetSnapshot(isPrivate: true, notes: [])) }
}

struct MementoWidgetView: View {
    var entry: MementoEntry
    @Environment(\.widgetFamily) private var family
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Memento").font(.headline)
                Spacer()
                Link(destination: URL(string: "memento://new")!) { Image(systemName: "square.and.pencil") }.accessibilityLabel("New Note")
            }
            if entry.snapshot.isPrivate {
                Label("Open to unlock", systemImage: "lock").font(.subheadline).foregroundStyle(.secondary)
            } else if entry.snapshot.notes.isEmpty {
                Text("Keep a thought.").foregroundStyle(.secondary)
            } else {
                ForEach(entry.snapshot.notes.prefix(family == .systemSmall ? 2 : 4)) { note in
                    Link(destination: URL(string: "memento://note/\(note.id.uuidString)")!) {
                        Text(note.title).font(.subheadline).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            Spacer(minLength: 0)
        }.containerBackground(.background, for: .widget)
            .widgetURL(URL(string: "memento://library"))
    }
}

@main
struct MementoWidget: Widget {
    let kind = "MementoRecentNotes"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MementoProvider()) { entry in MementoWidgetView(entry: entry) }
            .configurationDisplayName("Recent Notes").description("Return to a recent thought or start a new note.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
