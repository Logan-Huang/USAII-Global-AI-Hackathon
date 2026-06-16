import Foundation

enum APIError: Error {
    case badStatus(Int)
    case notFound
}

/// Thin client for the backend's non-streaming JSON endpoints. Native `URLSession`
/// is not subject to CORS, so no special headers/origin are needed.
struct APIClient {
    var baseURL: URL = AppConfig.baseURL
    var session: URLSession = .shared

    /// GET /api/resources?country=<name|code>
    func resources(country: String) async throws -> ResourcesResponse {
        try await getJSON(url(path: "/api/resources",
                              items: [URLQueryItem(name: "country", value: country)]))
    }

    /// GET /api/geocode?q=<place>
    func geocode(query: String) async throws -> GeocodeResult {
        try await getJSON(url(path: "/api/geocode",
                              items: [URLQueryItem(name: "q", value: query)]))
    }

    /// GET /api/places?lat&lon&radius
    func places(lat: Double, lon: Double, radius: Int) async throws -> [Place] {
        let resp: PlacesResponse = try await getJSON(url(path: "/api/places", items: [
            URLQueryItem(name: "lat", value: String(lat)),
            URLQueryItem(name: "lon", value: String(lon)),
            URLQueryItem(name: "radius", value: String(radius)),
        ]))
        return resp.places
    }

    // MARK: - internals

    private func url(path: String, items: [URLQueryItem]) -> URL {
        var comps = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        comps.path = path
        comps.queryItems = items
        return comps.url!
    }

    private func getJSON<T: Decodable>(_ url: URL) async throws -> T {
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        let (data, resp) = try await session.data(for: req)
        let status = (resp as? HTTPURLResponse)?.statusCode ?? -1
        if status == 404 { throw APIError.notFound }
        guard (200..<300).contains(status) else { throw APIError.badStatus(status) }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
