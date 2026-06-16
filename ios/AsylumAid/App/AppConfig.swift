import Foundation

/// App-wide configuration constants.
enum AppConfig {
    /// Base URL of the Express backend (the local-proxy that holds the Anthropic key).
    ///
    /// Default targets the dev server on the host machine. The iOS **Simulator** reaches
    /// the Mac's loopback directly, so `127.0.0.1:3000` works out of the box (paired with
    /// the `NSAllowsLocalNetworking` ATS exception in Info.plist).
    ///
    /// For a **physical device**, change this to your Mac's LAN IP (and start the backend
    /// bound to `0.0.0.0`), or point it at a deployed HTTPS host.
    static let baseURL = URL(string: "http://127.0.0.1:3000")!

    /// Search rings (metres) for the "help near you" map. Mirrors the web client: widen
    /// the radius before telling the user nothing is nearby (sparse rural mapping).
    static let placesRadii: [Int] = [8000, 16000, 25000]
}
