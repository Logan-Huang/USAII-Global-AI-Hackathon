import SwiftUI
import MapKit

/// "Help near you" — Apple Maps rendering of community-mapped places fetched from the
/// backend (which preserves the NGO-before-lawyer ranking). Labeled as UNVERIFIED
/// community data; the curated "Find legal help" directory remains the authoritative path.
struct MapHelpView: View {
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @StateObject private var locator = LocationProvider()

    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 20, longitude: 0),
        span: MKCoordinateSpan(latitudeDelta: 60, longitudeDelta: 60))
    @State private var places: [Place] = []
    @State private var loading = false
    @State private var loadingText = ""
    @State private var status: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                noteBanner

                Map(coordinateRegion: $region, annotationItems: places) { place in
                    MapMarker(coordinate: CLLocationCoordinate2D(latitude: place.lat, longitude: place.lon),
                              tint: .aaAccent)
                }
                .frame(height: 260)
                .overlay { if loading { loadingOverlay } }

                if let status {
                    statusRow(status)
                }

                placesList
            }
            .navigationTitle(app.t("mapHeading"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button { Task { await useMyLocation() } } label: {
                        Label(app.t("mapUseMyLocation"), systemImage: "location.fill")
                            .font(.system(size: 13, weight: .semibold))
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { dismiss() } label: { Image(systemName: "xmark.circle.fill") }
                        .tint(.aaTextMuted)
                        .accessibilityLabel(app.t("resourcesClose"))
                }
            }
            .environment(\.layoutDirection, app.isRTL ? .rightToLeft : .leftToRight)
        }
        .task {
            let query = app.mapQuery
            if !query.isEmpty { await centerByQuery(query) }
        }
    }

    // MARK: - Subviews

    private var noteBanner: some View {
        Text(app.t("mapNote"))
            .font(.system(size: 12))
            .foregroundColor(.aaWarningText)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(10)
            .background(Color.aaWarningBg)
    }

    private var loadingOverlay: some View {
        VStack(spacing: 8) {
            ProgressView()
            Text(loadingText).font(.system(size: 13)).foregroundColor(.aaTextMuted)
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: Metrics.radiusMd))
    }

    private func statusRow(_ text: String) -> some View {
        HStack {
            Text(text).font(.system(size: 13)).foregroundColor(.aaTextMuted)
            Spacer()
            Button(app.t("mapRetry")) {
                Task {
                    let query = app.mapQuery
                    if !query.isEmpty { await centerByQuery(query) }
                }
            }
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.aaPrimary)
        }
        .padding(.horizontal, 14).padding(.vertical, 8)
        .background(Color.aaSurface)
    }

    private var placesList: some View {
        List {
            if !places.isEmpty {
                Section(app.t("mapListHeading")) {
                    ForEach(places) { place in
                        Button {
                            region = MKCoordinateRegion(
                                center: CLLocationCoordinate2D(latitude: place.lat, longitude: place.lon),
                                span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03))
                        } label: {
                            placeRow(place)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    private func placeRow(_ place: Place) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(place.name).font(.system(size: 15, weight: .semibold)).foregroundColor(.aaText)
                Spacer()
                Text(place.category)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.aaAccentDark)
                    .padding(.vertical, 2).padding(.horizontal, 6)
                    .background(Color.aaAccentLight)
                    .clipShape(Capsule())
            }
            if !place.address.isEmpty {
                Text(place.address).font(.system(size: 12)).foregroundColor(.aaTextMuted)
            }
            if !place.phone.isEmpty {
                Text(place.phone).font(.system(size: 12)).foregroundColor(.aaTextMuted)
            }
            if !place.website.isEmpty, let url = URL(string: place.website) {
                Link(websiteLabel(place.website), destination: url)
                    .font(.system(size: 12))
                    .foregroundColor(.aaPrimary)
            }
        }
        .contentShape(Rectangle())
    }

    private func websiteLabel(_ s: String) -> String {
        let trimmed = s.replacingOccurrences(of: "https://", with: "")
                       .replacingOccurrences(of: "http://", with: "")
        return String(trimmed.prefix(40))
    }

    // MARK: - Data loading (mirrors the web flow: geocode → places, widening radius)

    @MainActor
    private func centerByQuery(_ query: String) async {
        loading = true; loadingText = app.t("mapSearching"); status = nil; places = []
        do {
            let loc = try await app.geocode(query)
            region = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: loc.lat, longitude: loc.lon),
                span: MKCoordinateSpan(latitudeDelta: 0.15, longitudeDelta: 0.15))
            await loadPlaces(lat: loc.lat, lon: loc.lon)
        } catch {
            loading = false
            status = app.t("mapError")
        }
    }

    @MainActor
    private func loadPlaces(lat: Double, lon: Double) async {
        loading = true; loadingText = app.t("mapSearching"); status = nil
        do {
            for (i, radius) in AppConfig.placesRadii.enumerated() {
                let list = try await app.places(lat: lat, lon: lon, radius: radius)
                if !list.isEmpty || i == AppConfig.placesRadii.count - 1 {
                    places = list
                    loading = false
                    status = list.isEmpty ? app.t("mapEmpty") : nil
                    return
                }
                loadingText = app.t("mapExpanding")
            }
        } catch {
            loading = false
            status = app.t("mapError")
        }
    }

    @MainActor
    private func useMyLocation() async {
        loading = true; loadingText = app.t("mapSearching"); status = nil
        guard let coord = await locator.current() else {
            loading = false
            status = app.t("mapError")
            return
        }
        region = MKCoordinateRegion(
            center: coord, span: MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12))
        await loadPlaces(lat: coord.latitude, lon: coord.longitude)
    }
}

/// One-shot CoreLocation helper bridging the delegate callbacks to async/await.
final class LocationProvider: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<CLLocationCoordinate2D?, Never>?

    override init() {
        super.init()
        manager.delegate = self
    }

    /// Requests permission (if needed) and returns a single location fix, or nil.
    func current() async -> CLLocationCoordinate2D? {
        await withCheckedContinuation { cont in
            self.continuation = cont
            manager.requestWhenInUseAuthorization()
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        finish(locations.first?.coordinate)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        finish(nil)
    }

    private func finish(_ coord: CLLocationCoordinate2D?) {
        continuation?.resume(returning: coord)
        continuation = nil
    }
}
