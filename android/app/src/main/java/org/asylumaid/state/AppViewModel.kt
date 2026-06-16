package org.asylumaid.state

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.asylumaid.i18n.Countries
import org.asylumaid.i18n.LocalizationStore
import org.asylumaid.i18n.devicePreferredLanguages
import org.asylumaid.i18n.loadLocalizationFromAssets
import org.asylumaid.model.ChatMessage
import org.asylumaid.model.GeocodeResult
import org.asylumaid.model.Place
import org.asylumaid.model.Profile
import org.asylumaid.model.ResourcesResponse
import org.asylumaid.model.toWire
import org.asylumaid.net.ApiClient
import org.asylumaid.net.ChatError
import org.asylumaid.net.ChatStream
import org.asylumaid.net.ChatStreamException

/**
 * All app state, held in memory only — nothing is persisted (no chat history on disk, no
 * analytics), mirroring the web/iOS clients' storage-free design. The Android analogue of
 * iOS `AppState`.
 */
class AppViewModel(app: Application) : AndroidViewModel(app) {

    enum class Stage { INTAKE, CHAT }

    val loc: LocalizationStore = loadLocalizationFromAssets(app)

    var lang by mutableStateOf(loc.detectLanguage(devicePreferredLanguages(app)))
        private set
    var profile by mutableStateOf<Profile?>(null)
        private set
    val messages = mutableStateListOf<ChatMessage>()
    var streaming by mutableStateOf(false)
        private set
    var stage by mutableStateOf(Stage.INTAKE)
        private set
    var showLangGate by mutableStateOf(true)
    var globalError by mutableStateOf<String?>(null)
        private set

    private val api = ApiClient()
    private val chat = ChatStream()
    private var streamJob: Job? = null

    // MARK: - Convenience

    val isRtl: Boolean get() = loc.isRtl(lang)
    fun t(key: String): String = loc.t(lang, key)
    fun setLanguage(code: String) { lang = code }

    // MARK: - Intake → chat

    fun submitIntake(
        originCode: String, asylumCode: String, location: String,
        gender: String?, civilStatus: String?, notes: String?,
    ) {
        val trimmedLocation = location.trim()
        if (originCode.isEmpty() || asylumCode.isEmpty() || trimmedLocation.isEmpty()) {
            globalError = t("errorRequired")
            return
        }
        globalError = null

        val p = Profile(
            countryOfOrigin = Countries.englishName(originCode),
            countryOfAsylum = Countries.englishName(asylumCode),
            currentLocation = trimmedLocation,
            gender = nonEmpty(gender),
            civilStatus = nonEmpty(civilStatus),
            notes = nonEmpty(notes),
        )
        profile = p
        messages.clear()
        stage = Stage.CHAT

        send(loc.buildInitialMessage(lang, p))
    }

    // MARK: - Chat

    fun send(text: String) {
        val p = profile ?: return
        if (streaming) return
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return

        messages.add(ChatMessage(ChatMessage.Kind.USER, trimmed))
        // Build the wire history NOW — before adding the empty assistant placeholder — so the
        // POST body matches the web/iOS clients (last message is the user's turn).
        val wire = messages.toList().toWire()
        val assistantIndex = messages.size
        messages.add(ChatMessage(ChatMessage.Kind.ASSISTANT, ""))
        streaming = true
        globalError = null

        val capturedLang = lang
        streamJob = viewModelScope.launch {
            try {
                chat.stream(capturedLang, p, wire).collect { delta ->
                    if (assistantIndex < messages.size) {
                        val cur = messages[assistantIndex]
                        messages[assistantIndex] = cur.copy(content = cur.content + delta)
                    }
                }
                finishStreaming(assistantIndex)
            } catch (e: ChatStreamException) {
                failStreaming(assistantIndex, e.reason)
            } catch (e: Throwable) {
                // Includes cancellation: clean up the placeholder; don't show an error bubble.
                finishStreaming(assistantIndex)
                throw e
            }
        }
    }

    fun stopStreaming() {
        streamJob?.cancel()
        streamJob = null
        streaming = false
    }

    fun startOver() {
        stopStreaming()
        messages.clear()
        profile = null
        globalError = null
        stage = Stage.INTAKE
    }

    // MARK: - Resources / map data

    suspend fun loadResources(): ResourcesResponse =
        api.resources(profile?.countryOfAsylum ?: "")

    suspend fun geocode(query: String): GeocodeResult = api.geocode(query)

    suspend fun places(lat: Double, lon: Double, radius: Int): List<Place> =
        api.places(lat, lon, radius)

    /** The query used to centre the map: current location, else country of asylum. */
    val mapQuery: String
        get() = profile?.let {
            if (it.currentLocation.isNotEmpty()) it.currentLocation else it.countryOfAsylum
        } ?: ""

    // MARK: - private

    private fun finishStreaming(assistantIndex: Int) {
        // An empty assistant turn (e.g. cancelled before any text) is dropped.
        if (assistantIndex < messages.size &&
            messages[assistantIndex].kind == ChatMessage.Kind.ASSISTANT &&
            messages[assistantIndex].content.isEmpty()
        ) {
            messages.removeAt(assistantIndex)
        }
        streaming = false
        streamJob = null
    }

    private fun failStreaming(assistantIndex: Int, reason: ChatError) {
        if (assistantIndex < messages.size &&
            messages[assistantIndex].kind == ChatMessage.Kind.ASSISTANT &&
            messages[assistantIndex].content.isEmpty()
        ) {
            messages.removeAt(assistantIndex)
        }
        val key = if (reason == ChatError.NETWORK) "errorNetwork" else "errorStream"
        val message = t(key)
        messages.add(ChatMessage(ChatMessage.Kind.ERROR, message))
        globalError = message
        streaming = false
        streamJob = null
    }

    private fun nonEmpty(s: String?): String? = s?.trim()?.ifEmpty { null }
}
