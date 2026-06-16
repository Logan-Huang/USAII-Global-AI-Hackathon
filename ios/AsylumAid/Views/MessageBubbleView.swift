import SwiftUI

/// One chat bubble: user (blue, trailing), assistant (white card, leading, markdown),
/// or an error notice (red). Mirrors the web bubble styling.
struct MessageBubbleView: View {
    @EnvironmentObject var app: AppState
    let message: ChatMessage

    var body: some View {
        switch message.kind {
        case .user:
            row(alignment: .trailing, roleKey: "youLabel") {
                Text(message.content)
                    .foregroundColor(.white)
                    .padding(.vertical, 9).padding(.horizontal, 13)
                    .background(Color.aaChatUserBg)
                    .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusLg, style: .continuous))
            }
        case .assistant:
            row(alignment: .leading, roleKey: "assistantLabel") {
                MarkdownView(blocks: MarkdownRenderer.render(message.content))
                    .padding(.vertical, 10).padding(.horizontal, 13)
                    .background(Color.aaChatAIBg)
                    .overlay(
                        RoundedRectangle(cornerRadius: Metrics.radiusLg, style: .continuous)
                            .stroke(Color.aaBorder, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusLg, style: .continuous))
            }
        case .error:
            HStack {
                Text(message.content)
                    .font(.system(size: 14))
                    .foregroundColor(.aaErrorText)
                    .padding(.vertical, 9).padding(.horizontal, 13)
                    .background(Color.aaErrorBg)
                    .overlay(
                        RoundedRectangle(cornerRadius: Metrics.radiusLg, style: .continuous)
                            .stroke(Color.aaErrorBorder, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusLg, style: .continuous))
                Spacer(minLength: 0)
            }
        }
    }

    @ViewBuilder
    private func row<Content: View>(alignment: HorizontalAlignment, roleKey: String,
                                    @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: alignment, spacing: 3) {
            Text(app.t(roleKey).uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.aaTextMuted)
            content()
        }
        .frame(maxWidth: .infinity, alignment: alignment == .trailing ? .trailing : .leading)
    }
}

/// Renders parsed markdown blocks. `Text(AttributedString)` shows bold + tappable links.
struct MarkdownView: View {
    let blocks: [MarkdownBlock]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                switch block {
                case .heading(let attr):
                    Text(attr)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.aaPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                case .paragraph(let attr):
                    Text(attr)
                        .font(.system(size: 15))
                        .foregroundColor(.aaText)
                        .tint(.aaPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                case .orderedList(let items):
                    list(items, ordered: true)
                case .unorderedList(let items):
                    list(items, ordered: false)
                }
            }
        }
    }

    @ViewBuilder
    private func list(_ items: [AttributedString], ordered: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                HStack(alignment: .firstTextBaseline, spacing: 7) {
                    Text(ordered ? "\(i + 1)." : "•")
                        .font(.system(size: 15, weight: ordered ? .semibold : .regular))
                        .foregroundColor(.aaTextMuted)
                    Text(item)
                        .font(.system(size: 15))
                        .foregroundColor(.aaText)
                        .tint(.aaPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}
