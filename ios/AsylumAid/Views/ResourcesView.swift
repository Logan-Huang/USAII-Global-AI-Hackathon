import SwiftUI

/// Curated "Find legal help" directory — the authoritative path (the map is secondary).
/// Loads `/api/resources?country=<countryOfAsylum>` and lists Official / Legal aid / Global.
struct ResourcesView: View {
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    enum LoadState { case loading, error, loaded(ResourcesResponse) }
    @State private var state: LoadState = .loading

    var body: some View {
        NavigationStack {
            content
                .navigationTitle(app.t("resourcesHeading"))
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button { dismiss() } label: { Image(systemName: "xmark.circle.fill") }
                            .tint(.aaTextMuted)
                            .accessibilityLabel(app.t("resourcesClose"))
                    }
                }
                .environment(\.layoutDirection, app.isRTL ? .rightToLeft : .leftToRight)
        }
        .task { await load() }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .loading:
            VStack(spacing: 12) {
                ProgressView()
                Text(app.t("resourcesLoading")).font(.system(size: 14)).foregroundColor(.aaTextMuted)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.aaBg)
        case .error:
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle").foregroundColor(.aaErrorBorder)
                Text(app.t("resourcesError")).font(.system(size: 14)).foregroundColor(.aaErrorText)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.aaBg)
        case .loaded(let data):
            loadedList(data)
        }
    }

    private func loadedList(_ data: ResourcesResponse) -> some View {
        let sections: [(title: String, items: [ResourceLink])] = [
            (app.t("resourcesOfficial"), data.official ?? []),
            (app.t("resourcesLegalAid"), data.legalAid ?? []),
            (app.t("resourcesGlobal"), data.global ?? []),
        ].filter { !$0.items.isEmpty }

        return List {
            Section {
                Text("\(app.t("resourcesSubheading")) \(app.profile?.countryOfAsylum ?? "")")
                    .font(.system(size: 13)).foregroundColor(.aaTextMuted)
            }
            if sections.isEmpty {
                Text(app.t("resourcesNone")).font(.system(size: 14)).foregroundColor(.aaTextMuted)
            }
            ForEach(sections, id: \.title) { section in
                Section(section.title) {
                    ForEach(section.items) { item in
                        Link(destination: URL(string: item.url) ?? URL(string: "https://help.unhcr.org/")!) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.name)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.aaPrimary)
                                if let desc = item.description, !desc.isEmpty {
                                    Text(desc).font(.system(size: 13)).foregroundColor(.aaTextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    @MainActor
    private func load() async {
        do {
            let data = try await app.loadResources()
            state = .loaded(data)
        } catch {
            state = .error
        }
    }
}
