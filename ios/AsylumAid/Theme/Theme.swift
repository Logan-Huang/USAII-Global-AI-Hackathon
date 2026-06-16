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

    static let aaBg            = Color(hex: 0xf5f6f8)
    static let aaSurface       = Color(hex: 0xffffff)
    static let aaBorder        = Color(hex: 0xd8dde6)
    static let aaBorderLight   = Color(hex: 0xe8ecf2)

    static let aaPrimary       = Color(hex: 0x1d5fa6) // deep trustworthy blue
    static let aaPrimaryDark   = Color(hex: 0x154d8a)
    static let aaPrimaryLight  = Color(hex: 0xdce8f7)

    static let aaAccent        = Color(hex: 0x2e7d52) // calm green for positive actions
    static let aaAccentDark    = Color(hex: 0x245f3e)
    static let aaAccentLight   = Color(hex: 0xd4eddf)

    static let aaWarningBg     = Color(hex: 0xfff8e6)
    static let aaWarningBorder = Color(hex: 0xe5c000)
    static let aaWarningText   = Color(hex: 0x7a5700)

    static let aaErrorBg       = Color(hex: 0xfdf2f2)
    static let aaErrorBorder   = Color(hex: 0xd94f4f)
    static let aaErrorText     = Color(hex: 0x8b1c1c)

    static let aaText          = Color(hex: 0x1a1f2e)
    static let aaTextMuted     = Color(hex: 0x4e5868)

    static let aaChatUserBg    = Color(hex: 0x1d5fa6)
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
            .padding(.vertical, 12)
            .padding(.horizontal, 24)
            .frame(maxWidth: .infinity)
            .background(disabled ? Color.aaAccent.opacity(0.5)
                                 : (configuration.isPressed ? Color.aaAccentDark : Color.aaAccent))
            .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous))
    }
}

/// White outlined "secondary" button (Find legal help, Help near me).
struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.aaPrimary)
            .padding(.vertical, 8)
            .padding(.horizontal, 14)
            .background(configuration.isPressed ? Color.aaPrimaryLight : Color.aaSurface)
            .overlay(
                RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous)
                    .stroke(Color.aaPrimary.opacity(0.4), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Metrics.radiusMd, style: .continuous))
    }
}
