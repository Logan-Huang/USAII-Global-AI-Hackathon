package org.asylumaid.net

import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Shared JSON + HTTP configuration for all backend calls.
 *
 * `explicitNulls = false` makes null optional fields (e.g. an unset `gender`) DISAPPEAR
 * from the encoded body, matching the web client where empty optionals are `undefined`.
 * `ignoreUnknownKeys = true` keeps the client resilient to additive server changes.
 */
val appJson: Json = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    encodeDefaults = false
}

/**
 * One OkHttp client for the app. No read timeout on the streaming chat call (the reply
 * arrives incrementally over many seconds); the JSON GETs set their own per-call timeout.
 * Native HTTP is not subject to CORS, so no origin/headers gymnastics are needed.
 */
val okHttp: OkHttpClient = OkHttpClient.Builder()
    .connectTimeout(20, TimeUnit.SECONDS)
    .readTimeout(0, TimeUnit.SECONDS) // streaming-friendly; GETs override via callTimeout
    .build()
