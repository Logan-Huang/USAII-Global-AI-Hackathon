import SwiftUI

/// Main chat screen: action toolbar, streaming message list, and the input bar.
struct ChatView: View {
    @EnvironmentObject var app: AppState
    @State private var input = ""
    @State private var showResources = false
    @State private var showMap = false
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            toolbar
            Divider()
            messageList
            inputBar
        }
        .background(Color.aaBg)
        .sheet(isPresented: $showResources) { ResourcesView().environmentObject(app) }
        .sheet(isPresented: $showMap) { MapHelpView().environmentObject(app) }
    }

    // MARK: - Toolbar

    private var toolbar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                Button(app.t("legalHelpButton")) { showResources = true }
                    .buttonStyle(SecondaryButtonStyle())
                Button(app.t("mapButton")) { showMap = true }
                    .buttonStyle(SecondaryButtonStyle())
                Button(app.t("newSessionButton")) { app.startOver() }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.aaTextMuted)
                    .padding(.horizontal, 6)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
        }
        .background(Color.aaSurface)
    }

    // MARK: - Messages

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 14) {
                    ForEach(app.messages) { msg in
                        MessageBubbleView(message: msg).id(msg.id)
                    }
                    if showTyping {
                        TypingIndicator(text: app.t("typingIndicator"))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .id("typing")
                    }
                    Color.clear.frame(height: 1).id("bottom")
                }
                .padding(16)
            }
            .onChange(of: app.messages.last?.content) { _ in scrollToBottom(proxy) }
            .onChange(of: app.messages.count) { _ in scrollToBottom(proxy) }
            .onChange(of: showTyping) { _ in scrollToBottom(proxy) }
        }
    }

    /// Show the typing indicator while streaming and before the first delta arrives.
    private var showTyping: Bool {
        guard app.streaming else { return false }
        if let last = app.messages.last, last.kind == .assistant, last.content.isEmpty { return true }
        return false
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        withAnimation(.easeOut(duration: 0.15)) { proxy.scrollTo("bottom", anchor: .bottom) }
    }

    // MARK: - Input

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField(app.t("inputPlaceholder"), text: $input, axis: .vertical)
                .lineLimit(1...5)
                .padding(.vertical, 8).padding(.horizontal, 12)
                .background(Color.aaSurface)
                .overlay(
                    RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous)
                        .stroke(Color.aaBorder, lineWidth: 1)
                )
                .focused($inputFocused)
                .disabled(app.streaming)

            Button {
                send()
            } label: {
                Text(app.streaming ? app.t("sendingButton") : app.t("sendButton"))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.vertical, 10).padding(.horizontal, 16)
                    .background(app.streaming ? Color.aaPrimary.opacity(0.5) : Color.aaPrimary)
                    .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous))
            }
            .disabled(app.streaming || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(12)
        .background(Color.aaSurface)
    }

    private func send() {
        let text = input
        input = ""
        app.send(text)
    }
}

/// Three bouncing dots + "Generating response…".
struct TypingIndicator: View {
    let text: String
    @State private var bounce = false

    var body: some View {
        HStack(spacing: 8) {
            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.aaTextMuted)
                        .frame(width: 7, height: 7)
                        .offset(y: bounce ? -3 : 3)
                        .animation(.easeInOut(duration: 0.5).repeatForever().delay(Double(i) * 0.15),
                                   value: bounce)
                }
            }
            Text(text).font(.system(size: 13)).foregroundColor(.aaTextMuted)
        }
        .padding(.vertical, 8).padding(.horizontal, 12)
        .background(Color.aaSurface)
        .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusLg, style: .continuous))
        .onAppear { bounce = true }
    }
}
