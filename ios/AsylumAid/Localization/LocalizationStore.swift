import Foundation

/// Loads the bundled UI-string table (`strings.json`, all 100 languages × keys) and
/// the canonical language list (`languages.json`), and resolves strings with the same
/// fallback chain as the web client's `i18n.t`:
///
///     strings[lang][key] ?? strings["en"][key] ?? key
///
/// Pure Foundation so the logic is unit-testable without the iOS UI.
final class LocalizationStore {
    let languages: [Language]
    private let strings: [String: [String: String]]
    private let rtlCodes: Set<String>
    private let supported: Set<String>

    init(strings: [String: [String: String]], languages: [Language]) {
        self.strings = strings
        self.languages = languages
        self.supported = Set(strings.keys)
        var rtl = Set(languages.filter { $0.isRTLFlagged }.map { $0.code })
        rtl.insert("ar") // always cover Arabic, mirroring i18n.js
        self.rtlCodes = rtl
    }

    /// Load from a bundle (the app) — falls back to empty so the app never crashes.
    static func load(bundle: Bundle = .main) -> LocalizationStore {
        let strings = Self.decode([String: [String: String]].self, "strings", bundle) ?? [:]
        let langFile = Self.decode(LanguagesFile.self, "languages", bundle)
        return LocalizationStore(strings: strings, languages: langFile?.languages ?? [])
    }

    /// Translate a key for a language, falling back to English then the key itself.
    func t(_ lang: String, _ key: String) -> String {
        if let v = strings[lang]?[key] { return v }
        if let v = strings["en"]?[key] { return v }
        return key
    }

    func isRTL(_ lang: String) -> Bool { rtlCodes.contains(lang) }

    func language(_ code: String) -> Language? { languages.first { $0.code == code } }

    /// Best supported language from the device preferences, else "en" (mirrors detectLanguage).
    func detectLanguage() -> String {
        for pref in Locale.preferredLanguages {
            let base = pref.lowercased().split(separator: "-").first.map(String.init) ?? ""
            if supported.contains(base) { return base }
        }
        return "en"
    }

    /// Compose the first user message from the profile, in the chosen language.
    /// Direct port of i18n.buildInitialMessage.
    func buildInitialMessage(lang: String, profile: Profile) -> String {
        let genderLine = (profile.gender?.isEmpty == false)
            ? t(lang, "genderLine").replacingOccurrences(of: "{gender}", with: profile.gender!)
            : ""
        let civilLine = (profile.civilStatus?.isEmpty == false)
            ? t(lang, "civilStatusLine").replacingOccurrences(of: "{civilStatus}", with: profile.civilStatus!)
            : ""
        let notes = (profile.notes?.isEmpty == false) ? profile.notes! + " " : ""

        return t(lang, "initialMessageTemplate")
            .replacingOccurrences(of: "{countryOfOrigin}", with: profile.countryOfOrigin)
            .replacingOccurrences(of: "{countryOfAsylum}", with: profile.countryOfAsylum)
            .replacingOccurrences(of: "{currentLocation}", with: profile.currentLocation)
            .replacingOccurrences(of: "{genderLine}", with: genderLine)
            .replacingOccurrences(of: "{civilStatusLine}", with: civilLine)
            .replacingOccurrences(of: "{notes}", with: notes)
    }

    // MARK: - Loading helpers

    private struct LanguagesFile: Decodable { let languages: [Language] }

    private static func decode<T: Decodable>(_ type: T.Type, _ name: String, _ bundle: Bundle) -> T? {
        guard let url = bundle.url(forResource: name, withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}
