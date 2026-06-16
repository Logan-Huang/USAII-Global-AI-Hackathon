package org.asylumaid

/** App-wide configuration constants (the Android analogue of iOS `AppConfig`). */
object AppConfig {
    /**
     * Base URL of the Express backend (the local-proxy that holds the Anthropic key).
     *
     * The Android **emulator** reaches the host machine's loopback at `10.0.2.2`
     * (NOT 127.0.0.1, which is the emulator itself), paired with the cleartext
     * exception in `res/xml/network_security_config.xml`.
     *
     * For a **physical device**, change this to your computer's LAN IP (and start the
     * backend bound to 0.0.0.0), or point it at a deployed HTTPS host.
     */
    const val BASE_URL = "http://10.0.2.2:3000"

    /**
     * Search rings (metres) for the "help near you" map. Mirrors the web/iOS clients:
     * widen the radius before telling the user nothing is nearby (sparse rural mapping).
     */
    val PLACES_RADII = listOf(8000, 16000, 25000)
}
