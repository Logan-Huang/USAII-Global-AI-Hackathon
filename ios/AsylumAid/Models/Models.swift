import Foundation

// MARK: - Profile

/// The user's intake profile. Sent with every chat request and used to look up
/// curated resources. Optional fields are omitted from the JSON when nil (matching
/// the web client, where empty optionals are `undefined`).
struct Profile: Codable, Equatable {
    var countryOfOrigin: String
    var countryOfAsylum: String
    var currentLocation: String
    var gender: String?
    var civilStatus: String?
    var notes: String?
}

// MARK: - Chat messages

/// Wire representation of a chat turn — exactly what `/api/chat` expects/returns.
struct WireMessage: Codable, Equatable {
    let role: String        // "user" | "assistant"
    let content: String
}

/// UI representation of a message. `error` bubbles are display-only and never sent
/// to the server (mirrors the web client, which keeps errors out of `state.messages`).
struct ChatMessage: Identifiable, Equatable {
    enum Kind { case user, assistant, error }
    let id = UUID()
    var kind: Kind
    var content: String
}

extension Array where Element == ChatMessage {
    /// The history to POST: user + assistant turns only, in order. Error bubbles drop out.
    var wire: [WireMessage] {
        compactMap { m in
            switch m.kind {
            case .user:      return WireMessage(role: "user", content: m.content)
            case .assistant: return WireMessage(role: "assistant", content: m.content)
            case .error:     return nil
            }
        }
    }
}

/// One line of the NDJSON chat stream: `{type:"delta",text}` / `{type:"done"}` / `{type:"error",message}`.
struct StreamEvent: Decodable {
    let type: String
    let text: String?
    let message: String?
}

// MARK: - Languages

struct Language: Codable, Identifiable, Equatable {
    let code: String
    let name: String
    let native: String?
    let rtl: Bool?

    var id: String { code }
    /// Native endonym when available, else the English name (matches the web picker).
    var displayNative: String { (native?.isEmpty == false) ? native! : name }
    var isRTLFlagged: Bool { rtl == true }
}

// MARK: - Resources

struct ResourceLink: Codable, Identifiable, Equatable {
    let name: String
    let url: String
    let description: String?
    var id: String { url + "|" + name }
}

struct ResourcesResponse: Codable {
    let country: String?
    let name: String?
    let official: [ResourceLink]?
    let legalAid: [ResourceLink]?
    let global: [ResourceLink]?
}

// MARK: - Map (geocode + places)

struct GeocodeResult: Codable {
    let lat: Double
    let lon: Double
    let displayName: String?
}

struct Place: Codable, Identifiable, Equatable {
    let name: String
    let lat: Double
    let lon: Double
    let category: String
    let phone: String
    let website: String
    let address: String

    var id: String { "\(lat),\(lon),\(name)" }

    enum CodingKeys: String, CodingKey {
        case name, lat, lon, category, phone, website, address
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        name = try c.decodeIfPresent(String.self, forKey: .name) ?? ""
        lat = try c.decode(Double.self, forKey: .lat)
        lon = try c.decode(Double.self, forKey: .lon)
        category = try c.decodeIfPresent(String.self, forKey: .category) ?? ""
        phone = try c.decodeIfPresent(String.self, forKey: .phone) ?? ""
        website = try c.decodeIfPresent(String.self, forKey: .website) ?? ""
        address = try c.decodeIfPresent(String.self, forKey: .address) ?? ""
    }

    // Memberwise init kept for tests / previews.
    init(name: String, lat: Double, lon: Double, category: String,
         phone: String = "", website: String = "", address: String = "") {
        self.name = name; self.lat = lat; self.lon = lon; self.category = category
        self.phone = phone; self.website = website; self.address = address
    }
}

struct PlacesResponse: Decodable {
    let count: Int
    let places: [Place]
}
