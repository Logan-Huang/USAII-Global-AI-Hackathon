import SwiftUI

/// Full-screen language picker shown on launch and re-openable from the header.
/// Searchable across native + English names, mirroring the web "language gate".
struct LanguageGateView: View {
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var filtered: [Language] {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return app.loc.languages }
        return app.loc.languages.filter {
            $0.name.lowercased().contains(q) || ($0.native ?? "").lowercased().contains(q)
        }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { lang in
                Button {
                    app.setLanguage(lang.code)
                    dismiss()
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lang.displayNative)
                                .font(.system(size: 16))
                                .foregroundColor(.aaText)
                            if let native = lang.native, native != lang.name {
                                Text(lang.name)
                                    .font(.system(size: 12))
                                    .foregroundColor(.aaTextMuted)
                            }
                        }
                        Spacer()
                        if lang.code == app.lang {
                            Image(systemName: "checkmark").foregroundColor(.aaPrimary)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .listStyle(.plain)
            .searchable(text: $search, prompt: app.t("langGateSearch"))
            .navigationTitle(app.t("langGateTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .environment(\.layoutDirection, app.isRTL ? .rightToLeft : .leftToRight)
            .safeAreaInset(edge: .top) {
                Text(app.t("langGateSub"))
                    .font(.system(size: 13))
                    .foregroundColor(.aaTextMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.vertical, 6)
                    .background(Color.aaBg)
            }
        }
    }
}
