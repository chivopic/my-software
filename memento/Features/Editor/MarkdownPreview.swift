import SwiftUI
import ImageIO
import MementoCore

struct MarkdownPreview: View {
    var bodyText: String
    var root: URL?
    var onToggleChecklist: (Int) -> Void
    @State private var folded: Set<Int> = []
    private var blocks: [DocumentBlock] { MarkdownDocument.parse(bodyText) }
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                ForEach(visibleBlocks) { block in
                    switch block.kind {
                    case .heading(let level):
                        Button {
                            if !folded.insert(block.id).inserted { folded.remove(block.id) }
                        } label: {
                            HStack {
                                Text(block.text).font(level == 1 ? .title : level == 2 ? .title2 : .title3).fontWeight(.semibold)
                                Image(systemName: folded.contains(block.id) ? "chevron.right" : "chevron.down").font(.caption)
                            }.foregroundStyle(.primary)
                        }.accessibilityLabel("\(block.text), \(folded.contains(block.id) ? "expand" : "collapse") section")
                    case .checklist(let checked):
                        Button { onToggleChecklist(block.id) } label: {
                            HStack(alignment: .top) {
                                Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                                inline(block.text).strikethrough(checked).foregroundStyle(checked ? .secondary : .primary)
                            }
                        }.buttonStyle(.plain).accessibilityLabel("\(block.text), \(checked ? "completed" : "incomplete")")
                    case .code(let language):
                        VStack(alignment: .leading, spacing: 4) {
                            if !language.isEmpty { Text(language).font(.caption).foregroundStyle(.secondary) }
                            Text(block.text).font(.system(.body, design: .monospaced)).textSelection(.enabled)
                        }.padding(12).frame(maxWidth: .infinity, alignment: .leading).background(Color(uiColor: .secondarySystemBackground))
                    case .quote:
                        HStack(alignment: .top) { Rectangle().fill(.tertiary).frame(width: 3); inline(block.text).italic() }
                    case .bullet:
                        HStack(alignment: .firstTextBaseline) { Text("•").foregroundStyle(.secondary); inline(block.text) }
                    case .table:
                        MarkdownTable(text: block.text)
                    case .image:
                        if let url = imageURL(block.text) { LocalImage(url: url).frame(maxHeight: 280) }
                        else { inline(block.text) }
                    case .paragraph: inline(block.text).textSelection(.enabled)
                    }
                }
                if blocks.isEmpty { Text("Your words start here.").foregroundStyle(.secondary) }
            }.padding(DesignTokens.bodyInset).frame(maxWidth: 760, alignment: .leading).frame(maxWidth: .infinity)
        }
    }
    private var visibleBlocks: [DocumentBlock] {
        var hiddenLevel: Int?
        return blocks.filter { block in
            if case .heading(let level) = block.kind {
                if let hidden = hiddenLevel, level <= hidden { hiddenLevel = nil }
                if hiddenLevel != nil { return false }
                if folded.contains(block.id) { hiddenLevel = level }
                return true
            }
            return hiddenLevel == nil
        }
    }
    private func inline(_ text: String) -> Text {
        if let value = try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)) { return Text(value) }
        return Text(text)
    }
    private func imageURL(_ text: String) -> URL? {
        guard let root, let start = text.range(of: "](attachments/"), let end = text[start.upperBound...].firstIndex(of: ")") else { return nil }
        let filename = String(text[start.upperBound..<end])
        guard !filename.contains("/"), !filename.contains("\\"), filename != ".." else { return nil }
        return root.appendingPathComponent("vault/attachments/\(filename)")
    }
}

struct LocalImage: View {
    var url: URL
    @State private var image: UIImage?
    var body: some View {
        Group {
            if let image { Image(uiImage: image).resizable().scaledToFit().accessibilityLabel("Note image") }
            else { Image(systemName: "photo").foregroundStyle(.secondary).accessibilityLabel("Image unavailable") }
        }.task(id: url) {
            image = await Task.detached {
                guard let values = try? url.resourceValues(forKeys: [.isSymbolicLinkKey, .isRegularFileKey]),
                      values.isRegularFile == true, values.isSymbolicLink != true,
                      url.resolvingSymlinksInPath().path == url.standardizedFileURL.path,
                      let source = CGImageSourceCreateWithURL(url as CFURL, nil),
                      let thumbnail = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                        kCGImageSourceCreateThumbnailFromImageAlways: true,
                        kCGImageSourceThumbnailMaxPixelSize: 1200,
                        kCGImageSourceCreateThumbnailWithTransform: true,
                        kCGImageSourceShouldCacheImmediately: true
                      ] as CFDictionary) else { return nil as UIImage? }
                return UIImage(cgImage: thumbnail)
            }.value
        }
    }
}

private struct MarkdownTable: View {
    var text: String
    private var rows: [[String]] {
        text.components(separatedBy: "\n").map { line in
            line.split(separator: "|", omittingEmptySubsequences: false).dropFirst().dropLast().map { $0.trimmingCharacters(in: .whitespaces) }
        }.filter { !$0.isEmpty && !$0.allSatisfy { value in value.allSatisfy { "-: ".contains($0) } } }
    }
    var body: some View {
        ScrollView(.horizontal) {
            Grid(alignment: .leading, horizontalSpacing: 20, verticalSpacing: 10) {
                ForEach(rows.indices, id: \.self) { row in
                    GridRow {
                        ForEach(rows[row].indices, id: \.self) { column in
                            Text(rows[row][column]).fontWeight(row == 0 ? .semibold : .regular).textSelection(.enabled)
                        }
                    }
                    if row == 0 { Divider().gridCellUnsizedAxes(.horizontal) }
                }
            }.padding(.vertical, 8)
        }
    }
}
