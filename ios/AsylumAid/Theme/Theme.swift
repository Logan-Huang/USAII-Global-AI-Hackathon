import SwiftUI

/// Brand palette and metrics, ported from the web client's `styles.css` :root tokens.
extension Color {
    init(hex: UInt) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255,
            opacity: 1
        )
    }

    static let aaBg            = Color(hex: 0xeef1f6)
    static let aaSurface       = Color(hex: 0xffffff)
    static let aaSurfaceAlt    = Color(hex: 0xf6f8fb) // subtle inset surface
    static let aaBorder        = Color(hex: 0xd2dae6)
    static let aaBorderLight   = Color(hex: 0xe5eaf1)

    static let aaInk           = Color(hex: 0x0c2742) // institutional navy (header/footer)
    static let aaInk2          = Color(hex: 0x103253)

    static let aaPrimary       = Color(hex: 0x16548f) // deep trustworthy blue
    static let aaPrimaryDark   = Color(hex: 0x0f3d6b)
    static let aaPrimaryLight  = Color(hex: 0xe2ecf7)

    static let aaGold          = Color(hex: 0xc6a14b) // seal gold (official accent)
    static let aaGoldDark      = Color(hex: 0xa8842f)

    static let aaAccent        = Color(hex: 0x1f7a4d) // measured green for positive actions
    static let aaAccentDark    = Color(hex: 0x155e3a)
    static let aaAccentLight   = Color(hex: 0xd9efe2)

    static let aaWarningBg     = Color(hex: 0xfdf6e3)
    static let aaWarningBorder = Color(hex: 0xd4a017)
    static let aaWarningStrong = Color(hex: 0xb07d12)
    static let aaWarningText   = Color(hex: 0x6e4f08)

    static let aaErrorBg       = Color(hex: 0xfdf1f1)
    static let aaErrorBorder   = Color(hex: 0xcf4040)
    static let aaErrorText     = Color(hex: 0x8a1c1c)

    static let aaText          = Color(hex: 0x16202e)
    static let aaTextMuted     = Color(hex: 0x51607a)

    static let aaChatUserBg    = Color(hex: 0x16548f)
    static let aaChatAIBg      = Color(hex: 0xffffff)
}

enum Metrics {
    static let radiusSm: CGFloat = 6
    static let radiusMd: CGFloat = 10
    static let radiusLg: CGFloat = 16
    static let radiusXl: CGFloat = 20
}

/// Green "primary action" button (Get guidance, Send).
struct AccentButtonStyle: ButtonStyle {
    var disabled: Bool = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.white)
            .padding(.vertical, 13)
            .padding(.horizontal, 24)
            .frame(maxWidth: .infinity)
            .background(disabled ? Color.aaAccent.opacity(0.5)
                                 : (configuration.isPressed ? Color.aaAccentDark : Color.aaAccent))
            .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous))
            .shadow(color: Color.aaAccentDark.opacity(disabled ? 0 : 0.28), radius: 6, x: 0, y: 2)
    }
}

/// White outlined "secondary" button (Find legal help, Help near me).
struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.aaPrimary)
            .padding(.vertical, 9)
            .padding(.horizontal, 15)
            .background(configuration.isPressed ? Color.aaPrimaryLight : Color.aaSurface)
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous)
                    .stroke(Color.aaPrimary.opacity(0.55), lineWidth: 1.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous))
    }
}
