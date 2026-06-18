import SwiftUI

struct RootView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        VStack(spacing: 0) {
            DisclaimerBanner(text: app.t("disclaimer"))
            HeaderBar()

            switch app.stage {
            case .intake: IntakeFormView()
            case .chat:   ChatView()
            }
        }
        .background(Color.aaBg.ignoresSafeArea())
        .environment(\.layoutDirection, app.isRTL ? .rightToLeft : .leftToRight)
        .tint(.aaPrimary)
        .sheet(isPresented: $app.showLangGate) {
            LanguageGateView().environmentObject(app)
        }
    }
}

/// Sticky "general information, not legal advice" banner — always visible.
/// Styled as a formal legal notice: warning glyph + bold amber text + a strong rule.
struct DisclaimerBanner: View {
    let text: String
    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.aaWarningStrong)
                .padding(.top, 1)
            Text(text)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundColor(.aaWarningText)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 9)
        .padding(.horizontal, 14)
        .background(Color.aaWarningBg)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.aaWarningStrong).frame(height: 3)
        }
    }
}

/// App header: institutional navy ground, a serif wordmark with a gold seal emblem,
/// a gold underline, and a language switcher (re-opens the language picker).
struct HeaderBar: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        HStack(spacing: 12) {
            Text("\u{2696}") // scales of justice
                .font(.system(size: 22))
                .foregroundColor(.aaGold)
                .frame(width: 40, height: 40)
                .background(Color.white.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .stroke(Color.aaGold.opacity(0.55), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(app.t("appTitle"))
                    .font(.system(size: 19, weight: .bold, design: .serif))
                    .foregroundColor(.white)
                Text(app.t("appSubtitle").uppercased())
                    .font(.system(size: 10, weight: .medium))
                    .tracking(0.5)
                    .foregroundColor(.white.opacity(0.78))
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            Button {
                app.showLangGate = true
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "globe")
                    Text(app.loc.language(app.lang)?.displayNative ?? app.lang)
                        .lineLimit(1)
                }
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.white)
                .padding(.vertical, 6)
                .padding(.horizontal, 10)
                .background(Color.white.opacity(0.12))
                .overlay(Capsule().stroke(Color.white.opacity(0.25), lineWidth: 1))
                .clipShape(Capsule())
            }
            .accessibilityLabel(app.t("languageLabel"))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(colors: [.aaInk2, .aaInk], startPoint: .top, endPoint: .bottom)
        )
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.aaGold).frame(height: 3)
        }
    }
}
