import Foundation

/// ISO 3166-1 alpha-2 country codes — the same curated list as the web client's
/// `window.COUNTRY_CODES`. Labels are localized at runtime via Foundation `Locale`
/// (the native equivalent of `Intl.DisplayNames`); the value submitted to the backend
/// is the canonical ENGLISH name, which `server/resources.js` normalizes.
enum Countries {
    static let codes: [String] = [
        "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BH","BD","BB",
        "BY","BE","BZ","BJ","BT","BO","BA","BW","BR","BN","BG","BF","BI","CV","KH",
        "CM","CA","CF","TD","CL","CN","CO","KM","CG","CD","CR","CI","HR","CU","CY",
        "CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI",
        "FR","GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU",
        "IS","IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KP",
        "KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MG","MW","MY",
        "MV","ML","MT","MH","MR","MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM",
        "NA","NR","NP","NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PS","PA",
        "PG","PY","PE","PH","PL","PT","QA","RO","RU","RW","KN","LC","VC","WS","SM",
        "ST","SA","SN","RS","SC","SL","SG","SK","SI","SB","SO","ZA","SS","ES","LK",
        "SD","SR","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR",
        "TM","TV","UG","UA","AE","GB","US","UY","UZ","VU","VE","VN","YE","ZM","ZW",
        "HK","MO","PR","XK",
    ]

    /// Canonical English name for a code (what gets sent to the backend).
    static func englishName(_ code: String) -> String {
        Locale(identifier: "en_US").localizedString(forRegionCode: code) ?? code
    }

    /// Display name localized to `lang`, falling back to the English name.
    static func localizedName(_ code: String, lang: String) -> String {
        Locale(identifier: lang).localizedString(forRegionCode: code) ?? englishName(code)
    }

    /// Codes sorted by their localized display name in `lang`.
    static func sorted(lang: String) -> [(code: String, name: String)] {
        codes
            .map { (code: $0, name: localizedName($0, lang: lang)) }
            .sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
    }
}
