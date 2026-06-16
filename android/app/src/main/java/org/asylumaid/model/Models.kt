package org.asylumaid.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// MARK: - Profile

/**
 * The user's intake profile. Sent with every chat request and used to look up curated
 * resources. Optional fields are OMITTED from the JSON when null (matching the web
 * client, where empty optionals are `undefined`). This requires the encoding Json to be
 * configured with `explicitNulls = false` — see `org.asylumaid.net.appJson`.
 */
@Serializable
data class Profile(
    val countryOfOrigin: String,
    val countryOfAsylum: String,
    val currentLocation: String,
    val gender: String? = null,
    val civilStatus: String? = null,
    val notes: String? = null,
)

// MARK: - Chat messages

/** Wire representation of a chat turn — exactly what `/api/chat` expects/returns. */
@Serializable
data class WireMessage(
    val role: String,   // "user" | "assistant"
    val content: String,
)

/**
 * UI representation of a message. `Error` bubbles are display-only and never sent to the
 * server (mirrors the web client, which keeps errors out of `state.messages`).
 */
data class ChatMessage(
    val kind: Kind,
    val content: String,
    val id: Long = nextId(),
) {
    enum class Kind { USER, ASSISTANT, ERROR }

    companion object {
        private var counter = 0L
        private fun nextId(): Long = ++counter
    }
}

/** The history to POST: user + assistant turns only, in order. Error bubbles drop out. */
fun List<ChatMessage>.toWire(): List<WireMessage> = mapNotNull { m ->
    when (m.kind) {
        ChatMessage.Kind.USER -> WireMessage("user", m.content)
        ChatMessage.Kind.ASSISTANT -> WireMessage("assistant", m.content)
        ChatMessage.Kind.ERROR -> null
    }
}

/** One line of the NDJSON chat stream: `{type:"delta",text}` / `{type:"done"}` / `{type:"error",message}`. */
@Serializable
data class StreamEvent(
    val type: String,
    val text: String? = null,
    val message: String? = null,
)

// MARK: - Languages

@Serializable
data class Language(
    val code: String,
    val name: String,
    val native: String? = null,
    val rtl: Boolean? = null,
) {
    /** Native endonym when available, else the English name (matches the web picker). */
    val displayNative: String get() = if (!native.isNullOrEmpty()) native else name
    val isRtlFlagged: Boolean get() = rtl == true
}

@Serializable
data class LanguagesFile(val languages: List<Language>)

// MARK: - Resources

@Serializable
data class ResourceLink(
    val name: String,
    val url: String,
    val description: String? = null,
)

@Serializable
data class ResourcesResponse(
    val country: String? = null,
    val name: String? = null,
    val official: List<ResourceLink>? = null,
    val legalAid: List<ResourceLink>? = null,
    val global: List<ResourceLink>? = null,
)

// MARK: - Map (geocode + places)

@Serializable
data class GeocodeResult(
    val lat: Double,
    val lon: Double,
    val displayName: String? = null,
)

@Serializable
data class Place(
    val name: String = "",
    val lat: Double,
    val lon: Double,
    val category: String = "",
    val phone: String = "",
    val website: String = "",
    val address: String = "",
)

@Serializable
data class PlacesResponse(
    val count: Int = 0,
    val places: List<Place> = emptyList(),
)
