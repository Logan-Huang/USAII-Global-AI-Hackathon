import Foundation
import Combine

/// All app state, held in memory only — nothing is persisted (no chat history on disk,
/// no analytics), mirroring the web client's storage-free design.
@MainActor
final class AppState: ObservableObject {
    enum Stage { case intake, chat }

    @Published var lang: String
    @Published var profile: Profile?
    @Published var messages: [ChatMessage] = []
    @Published var streaming = false
    @Published var stage: Stage = .intake
    @Published var showLangGate = true
    @Published var globalError: String?

    let loc: LocalizationStore
    private let api = APIClient()
    private let chat = ChatStream()
    private var streamTask: Task<Void, Never>?

    init(loc: LocalizationStore) {
        self.loc = loc
        self.lang = loc.detectLanguage()
    }

    // MARK: - Convenience

    var isRTL: Bool { loc.isRTL(lang) }
    func t(_ key: String) -> String { loc.t(lang, key) }
    func setLanguage(_ code: String) { lang = code }

    // MARK: - Intake → chat

    func submitIntake(originCode: String, asylumCode: String, location: String,
                      gender: String?, civilStatus: String?, notes: String?) {
        let trimmedLocation = location.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !originCode.isEmpty, !asylumCode.isEmpty, !trimmedLocation.isEmpty else {
            globalError = t("errorRequired")
            return
        }
        globalError = nil

        let profile = Profile(
            countryOfOrigin: Countries.englishName(originCode),
            countryOfAsylum: Countries.englishName(asylumCode),
            currentLocation: trimmedLocation,
            gender: nonEmpty(gender),
            civilStatus: nonEmpty(civilStatus),
            notes: nonEmpty(notes)
        )
        self.profile = profile
        messages = []
        stage = .chat

        send(loc.buildInitialMessage(lang: lang, profile: profile))
    }

    // MARK: - Chat

    func send(_ text: String) {
        guard !streaming, let profile else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        messages.append(ChatMessage(kind: .user, content: trimmed))
        // Build the wire history NOW — before adding the empty assistant placeholder —
        // so the POST body matches the web client (last message is the user's turn).
        let wire = messages.wire
        let assistantIndex = messages.count
        messages.append(ChatMessage(kind: .assistant, content: ""))
        streaming = true
        globalError = nil

        let lang = self.lang
        streamTask = Task { [weak self] in
            guard let self else { return }
            do {
                for try await delta in self.chat.stream(language: lang, profile: profile, messages: wire) {
                    if assistantIndex < self.messages.count {
                        self.messages[assistantIndex].content += delta
                    }
                }
                self.finishStreaming(assistantIndex: assistantIndex)
            } catch is CancellationError {
                self.finishStreaming(assistantIndex: assistantIndex)
            } catch let error {
                self.failStreaming(assistantIndex: assistantIndex, error: error)
            }
        }
    }

    func stopStreaming() {
        streamTask?.cancel()
        streamTask = nil
        streaming = false
    }

    func startOver() {
        stopStreaming()
        messages = []
        profile = nil
        globalError = nil
        stage = .intake
    }

    // MARK: - Resources / map data

    func loadResources() async throws -> ResourcesResponse {
        try await api.resources(country: profile?.countryOfAsylum ?? "")
    }
    func geocode(_ query: String) async throws -> GeocodeResult {
        try await api.geocode(query: query)
    }
    func places(lat: Double, lon: Double, radius: Int) async throws -> [Place] {
        try await api.places(lat: lat, lon: lon, radius: radius)
    }

    /// The query used to centre the map: current location, else country of asylum.
    var mapQuery: String {
        if let p = profile {
            if !p.currentLocation.isEmpty { return p.currentLocation }
            return p.countryOfAsylum
        }
        return ""
    }

    // MARK: - private

    private func finishStreaming(assistantIndex: Int) {
        // An empty assistant turn (e.g. cancelled before any text) is dropped.
        if assistantIndex < messages.count,
           messages[assistantIndex].kind == .assistant,
           messages[assistantIndex].content.isEmpty {
            messages.remove(at: assistantIndex)
        }
        streaming = false
        streamTask = nil
    }

    private func failStreaming(assistantIndex: Int, error: Error) {
        // Remove the empty assistant placeholder, then show a localized error bubble.
        if assistantIndex < messages.count,
           messages[assistantIndex].kind == .assistant,
           messages[assistantIndex].content.isEmpty {
            messages.remove(at: assistantIndex)
        }
        let key: String
        if let chatError = error as? ChatError, chatError == .network {
            key = "errorNetwork"
        } else {
            key = "errorStream"
        }
        let message = t(key)
        messages.append(ChatMessage(kind: .error, content: message))
        globalError = message
        streaming = false
        streamTask = nil
    }

    private func nonEmpty(_ s: String?) -> String? {
        guard let s = s?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else { return nil }
        return s
    }
}

extension ChatError: Equatable {}
