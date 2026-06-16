package org.asylumaid.net

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.Request
import org.asylumaid.AppConfig
import org.asylumaid.model.GeocodeResult
import org.asylumaid.model.Place
import org.asylumaid.model.PlacesResponse
import org.asylumaid.model.ResourcesResponse
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiException(val status: Int) : IOException("HTTP $status")
class NotFoundException : IOException("not_found")

/**
 * Thin client for the backend's non-streaming JSON endpoints (the Android analogue of
 * iOS `APIClient`). Runs blocking OkHttp on the IO dispatcher and decodes with kotlinx.
 */
class ApiClient(private val baseUrl: String = AppConfig.BASE_URL) {

    /** GET /api/resources?country=<name|code> */
    suspend fun resources(country: String): ResourcesResponse =
        getJson("/api/resources") { addQueryParameter("country", country) }

    /** GET /api/geocode?q=<place> */
    suspend fun geocode(query: String): GeocodeResult =
        getJson("/api/geocode") { addQueryParameter("q", query) }

    /** GET /api/places?lat&lon&radius */
    suspend fun places(lat: Double, lon: Double, radius: Int): List<Place> {
        val resp: PlacesResponse = getJson("/api/places") {
            addQueryParameter("lat", lat.toString())
            addQueryParameter("lon", lon.toString())
            addQueryParameter("radius", radius.toString())
        }
        return resp.places
    }

    private val getClient = okHttp.newBuilder()
        .callTimeout(20, TimeUnit.SECONDS)
        .build()

    private suspend inline fun <reified T> getJson(
        path: String,
        crossinline query: okhttp3.HttpUrl.Builder.() -> Unit,
    ): T = withContext(Dispatchers.IO) {
        val url = (baseUrl.trimEnd('/') + path).toHttpUrl().newBuilder().apply(query).build()
        val req = Request.Builder().url(url).get()
            .header("Accept", "application/json")
            .build()
        getClient.newCall(req).execute().use { resp ->
            when {
                resp.code == 404 -> throw NotFoundException()
                !resp.isSuccessful -> throw ApiException(resp.code)
                else -> appJson.decodeFromString<T>(resp.body!!.string())
            }
        }
    }
}
