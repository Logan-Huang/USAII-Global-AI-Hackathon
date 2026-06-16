package org.asylumaid.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.content.getSystemService
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/**
 * One-shot location fix bridging Android's callback API to a suspend function — the analogue
 * of iOS `LocationProvider`. Uses the framework `LocationManager` (no Google Play Services
 * dependency, so the app runs on non-GMS devices). The caller must hold a location permission.
 */
object LocationProvider {

    /** Returns a single coordinate (lat, lon), or null if unavailable/timed out. */
    @SuppressLint("MissingPermission")
    suspend fun current(context: Context, timeoutMs: Long = 12_000): Pair<Double, Double>? {
        val lm = context.getSystemService<LocationManager>() ?: return null
        return withTimeoutOrNull(timeoutMs) {
            // A recent last-known fix is good enough to centre the map and avoids waiting on GPS.
            lastKnown(lm)?.let { return@withTimeoutOrNull it.lat to it.lon }

            suspendCancellableCoroutine { cont ->
                var resumed = false
                fun deliver(loc: Location?) {
                    if (resumed) return
                    resumed = true
                    cont.resume(loc?.let { it.latitude to it.longitude })
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    val cancel = android.os.CancellationSignal()
                    cont.invokeOnCancellation { cancel.cancel() }
                    val provider = bestProvider(lm)
                    if (provider == null) { deliver(null); return@suspendCancellableCoroutine }
                    lm.getCurrentLocation(provider, cancel, context.mainExecutor) { deliver(it) }
                } else {
                    val provider = bestProvider(lm)
                    if (provider == null) { deliver(null); return@suspendCancellableCoroutine }
                    // Explicit object (not a SAM lambda): pre-API-30 `LocationListener` has
                    // several abstract methods, so a lambda would crash at runtime.
                    val listener = object : android.location.LocationListener {
                        override fun onLocationChanged(location: Location) {
                            deliver(location)
                            lm.removeUpdates(this)
                        }
                        override fun onProviderDisabled(provider: String) {}
                        override fun onProviderEnabled(provider: String) {}
                        @Deprecated("Deprecated in API 29")
                        override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
                    }
                    lm.requestSingleUpdate(provider, listener, context.mainLooper)
                    cont.invokeOnCancellation { lm.removeUpdates(listener) }
                }
            }
        }
    }

    private data class LL(val lat: Double, val lon: Double)

    @SuppressLint("MissingPermission")
    private fun lastKnown(lm: LocationManager): LL? {
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        for (p in providers) {
            if (!lm.isProviderEnabled(p)) continue
            lm.getLastKnownLocation(p)?.let { return LL(it.latitude, it.longitude) }
        }
        return null
    }

    private fun bestProvider(lm: LocationManager): String? = when {
        lm.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
        lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
        else -> null
    }
}
