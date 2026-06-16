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
struct DisclaimerBanner: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 12.5, weight: .medium))
            .foregroundColor(.aaWarningText)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(Color.aaWarningBg)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Color.aaWarningBorder).frame(height: 2)
            }
    }
}

/// App header with brand + a language switcher (re-opens the language picker).
struct HeaderBar: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        HStack(spacing: 12) {
            Text("\u{26FA}") // shelter / tent glyph
                .font(.system(size: 22))
                .frame(width: 38, height: 38)
                .background(Color.white.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusSm, style: .continuous))

            VStack(alignment: .leading, spacing: 1) {
                Text(app.t("appTitle"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.white)
                Text(app.t("appSubtitle"))
                    .font(.system(size: 11.5))
                    .foregroundColor(.white.opacity(0.85))
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
                .background(Color.white.opacity(0.15))
                .clipShape(Capsule())
            }
            .accessibilityLabel(app.t("languageLabel"))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity)
        .background(Color.aaPrimary)
    }
}
