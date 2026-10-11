import SwiftUI
import UIKit

@MainActor enum DesignTokens {
    static let small: CGFloat = 8
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
    static let bodyInset: CGFloat = 20
    static let accent = Color.accentColor
    static let secondary = Color.secondary
    static func feedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }
}

enum Appearance: String, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }
    var colorScheme: ColorScheme? {
        switch self { case .system: nil; case .light: .light; case .dark: .dark }
    }
}

struct HighlightedText: View {
    var text: String
    var query: String
    var body: some View { Text(highlighted) }
    private var highlighted: AttributedString {
        var value = AttributedString(text)
        for term in query.split(whereSeparator: \.isWhitespace) {
            var search = text.startIndex..<text.endIndex
            while let range = text.range(of: String(term), options: [.caseInsensitive, .diacriticInsensitive], range: search) {
                if let start = AttributedString.Index(range.lowerBound, within: value),
                   let end = AttributedString.Index(range.upperBound, within: value) {
                    value[start..<end].foregroundColor = .accentColor
                    value[start..<end].inlinePresentationIntent = .stronglyEmphasized
                }
                guard range.upperBound < text.endIndex else { break }
                search = range.upperBound..<text.endIndex
            }
        }
        return value
    }
}
