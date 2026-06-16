package org.asylumaid.net

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.Serializable
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.asylumaid.AppConfig
import org.asylumaid.model.Profile
import org.asylumaid.model.StreamEvent
import org.asylumaid.model.WireMessage
import java.io.IOException
import kotlin.coroutines.coroutineContext

/** Why a chat stream ended badly. The UI maps these to localized messages. */
enum class ChatError { NETWORK, STREAM }
class ChatStreamException(val reason: ChatError) : IOException(reason.name)

/**
 * Streams `/api/chat` (newline-delimited JSON) as an ordered [Flow] of assistant text
 * deltas — the Android analogue of the web client's TextDecoder loop and iOS `bytes.lines`.
 *
 * OkHttp's streaming `ResponseBody.source()` + `readUtf8Line()` splits on `\n` and decodes
 * multi-byte UTF-8 across chunk boundaries. Each line is
 * `{type:"delta",text}` / `{type:"done"}` / `{type:"error",message}`.
 *
 * The flow throws [ChatStreamException] with [ChatError.NETWORK] if the connection fails
 * before any data, or [ChatError.STREAM] on a mid-stream / server error line.
 */
class ChatStream(private val baseUrl: String = AppConfig.BASE_URL) {

    @Serializable
    private data class RequestBody(
        val language: String,
        val profile: Profile,
        val messages: List<WireMessage>,
    )

    fun stream(
        language: String,
        profile: Profile,
        messages: List<WireMessage>,
    ): Flow<String> = flow {
        val bodyJson = appJson.encodeToString(RequestBody(language, profile, messages))
        val req = Request.Builder()
            .url(baseUrl.trimEnd('/') + "/api/chat")
            .header("Accept", "application/x-ndjson")
            .post(bodyJson.toRequestBody("application/json".toMediaType()))
            .build()

        val call = okHttp.newCall(req)
        val response = try {
            call.execute()
        } catch (e: IOException) {
            throw ChatStreamException(ChatError.NETWORK)
        }

        response.use { resp ->
            val httpOk = resp.isSuccessful
            val source = resp.body?.source() ?: throw ChatStreamException(ChatError.STREAM)
            try {
                while (true) {
                    coroutineContext.ensureActive() // cooperative cancellation
                    val line = source.readUtf8Line() ?: break
                    val trimmed = line.trim()
                    if (trimmed.isEmpty()) continue
                    val event = runCatching { appJson.decodeFromString<StreamEvent>(trimmed) }
                        .getOrNull() ?: continue // defensive: skip malformed lines
                    when (event.type) {
                        "delta" -> event.text?.let { emit(it) }
                        "done" -> return@use
                        // Server reports failures (incl. rate-limit) as an error line; the
                        // UI surfaces a localized message, not the raw server text.
                        "error" -> throw ChatStreamException(ChatError.STREAM)
                    }
                }
                // Stream ended with no explicit `done`; a non-2xx is a failure.
                if (!httpOk) throw ChatStreamException(ChatError.STREAM)
            } finally {
                call.cancel()
            }
        }
    }.flowOn(Dispatchers.IO)
}
