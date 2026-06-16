import SwiftUI

/// Intake form: collects the profile (3 required + 3 optional fields) and starts the
/// chat. Required fields are enforced client-side, matching the web form.
struct IntakeFormView: View {
    @EnvironmentObject var app: AppState

    @State private var originCode = ""
    @State private var asylumCode = ""
    @State private var location = ""
    @State private var gender = ""      // stable English value, "" = unspecified
    @State private var civil = ""
    @State private var notes = ""

    private static let genderOptions: [(value: String, key: String)] = [
        ("Female", "genderFemale"), ("Male", "genderMale"),
        ("Non-binary", "genderNonBinary"), ("Prefer not to say", "genderPreferNot"),
    ]
    private static let civilOptions: [(value: String, key: String)] = [
        ("Single", "civilSingle"), ("Married", "civilMarried"), ("Divorced", "civilDivorced"),
        ("Widowed", "civilWidowed"), ("Separated", "civilSeparated"), ("Prefer not to say", "civilPreferNot"),
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(app.t("intakeSubheading"))
                        .font(.system(size: 13))
                        .foregroundColor(.aaTextMuted)
                } header: {
                    Text(app.t("intakeHeading"))
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.aaText)
                        .textCase(nil)
                }

                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(app.t("privacyHeading"))
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.aaPrimaryDark)
                        Text(app.t("privacyNotice"))
                            .font(.system(size: 13))
                            .foregroundColor(.aaText)
                    }
                    .listRowBackground(Color.aaPrimaryLight)
                }

                Section {
                    CountryField(label: app.t("countryOfOriginLabel"),
                                 placeholder: app.t("countrySelectPlaceholder"),
                                 lang: app.lang, code: $originCode)
                    CountryField(label: app.t("countryOfAsylumLabel"),
                                 placeholder: app.t("countrySelectPlaceholder"),
                                 lang: app.lang, code: $asylumCode)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(app.t("currentLocationLabel")).font(.system(size: 13, weight: .medium))
                        TextField(app.t("currentLocationPlaceholder"), text: $location)
                            .textInputAutocapitalization(.words)
                    }

                    ChoiceField(label: app.t("genderLabel"),
                                placeholder: app.t("choosePlaceholder"),
                                options: Self.genderOptions, selection: $gender)
                    ChoiceField(label: app.t("civilStatusLabel"),
                                placeholder: app.t("choosePlaceholder"),
                                options: Self.civilOptions, selection: $civil)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(app.t("notesLabel")).font(.system(size: 13, weight: .medium))
                        TextField(app.t("notesPlaceholder"), text: $notes, axis: .vertical)
                            .lineLimit(2...5)
                    }
                }

                Section {
                    if let err = app.globalError {
                        Text(err)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.aaErrorText)
                            .listRowBackground(Color.aaErrorBg)
                    }
                    Button(app.t("submitButton")) { submit() }
                        .buttonStyle(AccentButtonStyle())
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                    Text(app.t("requiredNote"))
                        .font(.system(size: 12))
                        .foregroundColor(.aaTextMuted)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.aaBg)
            .navigationBarHidden(true)
            .environment(\.layoutDirection, app.isRTL ? .rightToLeft : .leftToRight)
        }
    }

    private func submit() {
        app.submitIntake(originCode: originCode, asylumCode: asylumCode, location: location,
                         gender: gender, civilStatus: civil, notes: notes)
    }
}

// MARK: - Country field (drills into a searchable list)

private struct CountryField: View {
    let label: String
    let placeholder: String
    let lang: String
    @Binding var code: String

    var body: some View {
        NavigationLink {
            CountryListView(lang: lang, selectedCode: $code)
        } label: {
            HStack {
                Text(label).font(.system(size: 13, weight: .medium))
                Spacer()
                Text(code.isEmpty ? placeholder : Countries.localizedName(code, lang: lang))
                    .font(.system(size: 14))
                    .foregroundColor(code.isEmpty ? .aaTextMuted : .aaText)
                    .lineLimit(1)
            }
        }
    }
}

private struct CountryListView: View {
    let lang: String
    @Binding var selectedCode: String
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var items: [(code: String, name: String)] {
        let all = Countries.sorted(lang: lang)
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        return q.isEmpty ? all : all.filter { $0.name.lowercased().contains(q) }
    }

    var body: some View {
        List(items, id: \.code) { item in
            Button {
                selectedCode = item.code
                dismiss()
            } label: {
                HStack {
                    Text(item.name).foregroundColor(.aaText)
                    Spacer()
                    if item.code == selectedCode {
                        Image(systemName: "checkmark").foregroundColor(.aaPrimary)
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .listStyle(.plain)
        .searchable(text: $search)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Optional choice field (gender / civil status)

private struct ChoiceField: View {
    let label: String
    let placeholder: String
    let options: [(value: String, key: String)]
    @Binding var selection: String
    @EnvironmentObject var app: AppState

    private var displayLabel: String {
        if let opt = options.first(where: { $0.value == selection }) { return app.t(opt.key) }
        return placeholder
    }

    var body: some View {
        HStack {
            Text(label).font(.system(size: 13, weight: .medium))
            Spacer()
            Menu {
                Button(placeholder) { selection = "" }
                ForEach(options, id: \.value) { opt in
                    Button(app.t(opt.key)) { selection = opt.value }
                }
            } label: {
                Text(displayLabel)
                    .font(.system(size: 14))
                    .foregroundColor(selection.isEmpty ? .aaTextMuted : .aaText)
                    .lineLimit(1)
            }
        }
    }
}
