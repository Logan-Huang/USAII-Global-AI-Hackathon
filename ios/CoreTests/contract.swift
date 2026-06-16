import Foundation

// Contract test: decode REAL backend responses (captured to /tmp/contract_*.json by
// booting server/server.js) through the app's actual Codable structs. Proves the
// models match ground truth, not just hand-written sample JSON.
//
//   swiftc ios/AsylumAid/Models/Models.swift ios/CoreTests/contract.swift -o /tmp/contract && /tmp/contract

var failures = 0
func check(_ cond: Bool, _ name: String) {
    if cond { print("  ✓ \(name)") } else { print("  ✗ \(name)"); failures += 1 }
}
func data(_ name: String) -> Data {
    try! Data(contentsOf: URL(fileURLWithPath: "/tmp/contract_\(name).json"))
}

@main enum Contract {
static func main() {

print("Decoding real backend responses:")

do {
    let r = try JSONDecoder().decode(ResourcesResponse.self, from: data("resources"))
    check(r.country == "US", "resources.country == US")
    check((r.official?.count ?? 0) > 0, "resources.official non-empty (\(r.official?.count ?? 0))")
    check(r.official?.first?.url.hasPrefix("https://") == true, "official link has https url")
    check((r.global?.count ?? 0) > 0, "resources.global present (\(r.global?.count ?? 0))")
} catch {
    check(false, "ResourcesResponse decode: \(error)")
}

do {
    let g = try JSONDecoder().decode(GeocodeResult.self, from: data("geocode"))
    check(abs(g.lat - 52.52) < 1.0 && abs(g.lon - 13.41) < 1.0, "geocode lat/lon plausible (\(g.lat),\(g.lon))")
    check((g.displayName ?? "").contains("Berlin"), "geocode displayName contains Berlin")
} catch {
    check(false, "GeocodeResult decode: \(error)")
}

do {
    let p = try JSONDecoder().decode(PlacesResponse.self, from: data("places"))
    check(p.count == p.places.count, "places.count matches array length (\(p.count))")
    check(p.places.count > 0, "places non-empty")
    if let first = p.places.first {
        check(!first.name.isEmpty, "place has a name")
        check(!first.category.isEmpty, "place has a category (\(first.category))")
        // phone/address may legitimately be empty — just confirm they decoded as strings.
        check(first.id.contains(","), "place id derived from coords")
    }
} catch {
    check(false, "PlacesResponse decode: \(error)")
}

print(failures == 0 ? "\nCONTRACT OK" : "\n\(failures) FAILED")
exit(failures == 0 ? 0 : 1)
}
}
