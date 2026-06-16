import SwiftUI

@main
struct AsylumAidApp: App {
    @StateObject private var app = AppState(loc: .load())

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .preferredColorScheme(.light) // the brand is a light theme
        }
    }
}
