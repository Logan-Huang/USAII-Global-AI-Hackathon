import Foundation

// Lightweight test harness for the Foundation-only core. Compiled & run with the
// macOS Swift toolchain (no Xcode/iOS SDK needed):
//
//   swiftc ios/AsylumAid/App/AppConfig.swift ios/AsylumAid/Models/Models.swift \
//          ios/AsylumAid/Localization/LocalizationStore.swift \
//          ios/AsylumAid/Rendering/MarkdownRenderer.swift \
//          ios/AsylumAid/Networking/APIClient.swift \
//          ios/AsylumAid/Networking/ChatStream.swift \
//          ios/CoreTests/main.swift -o /tmp/coretest && /tmp/coretest
//
// Verifies the logic the SwiftUI layer depends on; UI itself is Xcode-only.

var failures = 0
func check(_ cond: Bool, _ name: String) {
    if cond { print("  ✓ \(name)") } else { print("  ✗ \(name)"); failures += 1 }
}

// Resolve repo root from this file's location (…/ios/CoreTests/main.swift).
let here = URL(fileURLWithPath: #filePath)
let repoRoot = here.deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
let resDir = repoRoot.appendingPathComponent("ios/AsylumAid/Resources")

// MARK: - Load the generated bundle data

func loadStore() -> LocalizationStore {
    let sData = try! Data(contentsOf: resDir.appendingPathComponent("strings.json"))
    let strings = try! JSONDecoder().decode([String: [String: String]].self, from: sData)
    let lData = try! Data(contentsOf: resDir.appendingPathComponent("languages.json"))
    struct LF: Decodable { let languages: [Language] }
    let langs = try! JSONDecoder().decode(LF.self, from: lData).languages
    return LocalizationStore(strings: strings, languages: langs)
}
let store = loadStore()

print("LocalizationStore:")
check(store.languages.count == 100, "languages.json has 100 entries (\(store.languages.count))")
check(store.t("en", "submitButton") == "Get guidance", "en submitButton")
check(store.t("so", "submitButton") != store.t("en", "submitButton"), "so submitButton differs from en (translated)")
check(store.t("zz", "submitButton") == store.t("en", "submitButton"), "unknown lang falls back to en")
check(store.t("en", "totally_missing_key") == "totally_missing_key", "missing key returns key")
check(store.isRTL("ar") && store.isRTL("ps") && store.isRTL("he"), "RTL: ar/ps/he true")
check(!store.isRTL("en") && !store.isRTL("es"), "RTL: en/es false")

print("buildInitialMessage:")
let pFull = Profile(countryOfOrigin: "Afghanistan", countryOfAsylum: "United States",
                    currentLocation: "New York, USA", gender: "Female",
                    civilStatus: "Single", notes: "I arrived two weeks ago.")
let msgEn = store.buildInitialMessage(lang: "en", profile: pFull)
check(!msgEn.contains("{"), "no leftover {placeholders} in en message")
check(msgEn.contains("Afghanistan") && msgEn.contains("United States") && msgEn.contains("New York, USA"),
      "en message includes origin/asylum/location")
check(msgEn.contains("My gender is Female.") && msgEn.contains("My civil status is Single."),
      "en message includes gender + civil lines")
check(msgEn.contains("I arrived two weeks ago."), "en message includes notes")

let pMin = Profile(countryOfOrigin: "Syria", countryOfAsylum: "Germany",
                   currentLocation: "Berlin", gender: nil, civilStatus: nil, notes: nil)
let msgMin = store.buildInitialMessage(lang: "en", profile: pMin)
check(!msgMin.contains("{"), "no leftover {placeholders} in minimal message")
check(!msgMin.lowercased().contains("my gender is"), "minimal message omits gender line")
let msgEs = store.buildInitialMessage(lang: "es", profile: pMin)
check(!msgEs.contains("{") && msgEs.contains("Siria") == false || msgEs.contains("Syria"),
      "es message fills the (English) country name verbatim")
check(msgEs != msgMin, "es template differs from en")

// MARK: - Markdown

print("MarkdownRenderer:")
// The key quirk: blank lines between ordered items keep ONE list (no renumber).
let listMd = "1. First\n2. Second\n\n3. Third\n\nFor more info see below."
let listBlocks = MarkdownRenderer.render(listMd)
if case let .orderedList(items)? = listBlocks.first {
    check(items.count == 3, "ordered list keeps 3 items across blank line (\(items.count))")
} else {
    check(false, "first block is an ordered list")
}
check(listBlocks.count == 2, "list + trailing paragraph = 2 blocks (\(listBlocks.count))")
if case .paragraph = listBlocks.last { check(true, "trailing block is a paragraph") }
else { check(false, "trailing block is a paragraph") }

let headingBlocks = MarkdownRenderer.render("## Next steps\nDo this.")
if case .heading = headingBlocks.first { check(true, "heading parsed") }
else { check(false, "heading parsed") }

// Bold
let boldAttr = MarkdownRenderer.renderInline("This is **important** text")
let hasBold = boldAttr.runs.contains { $0.inlinePresentationIntent == .stronglyEmphasized }
check(hasBold, "bold run present")
check(String(boldAttr.characters) == "This is important text", "bold markers stripped")

// Link (http allowed; non-http dropped to text)
let linkAttr = MarkdownRenderer.renderInline("See [UNHCR](https://help.unhcr.org/) now")
let hasLink = linkAttr.runs.contains { $0.link == URL(string: "https://help.unhcr.org/") }
check(hasLink, "http link attribute present")
check(String(linkAttr.characters) == "See UNHCR now", "link renders label text")
let badLink = MarkdownRenderer.renderInline("Bad [x](ftp://evil.test) link")
let hasBadLink = badLink.runs.contains { $0.link != nil }
check(!hasBadLink, "non-http link dropped (no link attribute)")
check(String(badLink.characters) == "Bad x link", "non-http link keeps label only")

// MARK: - Wire models / JSON contracts

print("JSON contracts:")
let enc = JSONEncoder()
let nilGender = try! enc.encode(pMin)
let nilStr = String(data: nilGender, encoding: .utf8)!
check(!nilStr.contains("gender"), "nil optional profile fields are omitted from JSON")
let withGender = String(data: try! enc.encode(pFull), encoding: .utf8)!
check(withGender.contains("\"gender\":\"Female\""), "set optional fields are encoded")

let events = [
    "{\"type\":\"delta\",\"text\":\"Hello \"}",
    "{\"type\":\"delta\",\"text\":\"world\"}",
    "{\"type\":\"done\"}",
    "{\"type\":\"error\",\"message\":\"boom\"}",
]
let decoded = events.compactMap { try? JSONDecoder().decode(StreamEvent.self, from: $0.data(using: .utf8)!) }
check(decoded.count == 4, "all 4 NDJSON lines decode")
check(decoded[0].type == "delta" && decoded[0].text == "Hello ", "delta decodes text")
check(decoded[3].type == "error" && decoded[3].message == "boom", "error decodes message")

let placeJSON = "{\"name\":\"Refugee Center\",\"lat\":40.7,\"lon\":-74.0,\"category\":\"NGO\"}"
let place = try! JSONDecoder().decode(Place.self, from: placeJSON.data(using: .utf8)!)
check(place.phone == "" && place.website == "" && place.address == "", "Place tolerates missing optional strings")
check(place.category == "NGO", "Place category decodes")

let history: [ChatMessage] = [
    ChatMessage(kind: .user, content: "hi"),
    ChatMessage(kind: .assistant, content: "hello"),
    ChatMessage(kind: .error, content: "network error"),
]
check(history.wire.count == 2, "error bubbles are excluded from wire history")
check(history.wire.last?.role == "assistant", "wire history preserves roles")

print(failures == 0 ? "\nALL PASSED" : "\n\(failures) FAILED")
exit(failures == 0 ? 0 : 1)
