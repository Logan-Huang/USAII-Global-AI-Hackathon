package org.asylumaid.i18n

import android.content.Context
import androidx.core.os.ConfigurationCompat

/** Android-side loader: reads the bundled JSON assets and the device language preferences. */
fun loadLocalizationFromAssets(context: Context): LocalizationStore {
    val strings = context.assets.open("strings.json").bufferedReader().use { it.readText() }
    val langs = context.assets.open("languages.json").bufferedReader().use { it.readText() }
    return LocalizationStore.fromJson(strings, langs)
}

/** The device's ordered language tags (e.g. ["es-MX", "en-US"]), for [LocalizationStore.detectLanguage]. */
fun devicePreferredLanguages(context: Context): List<String> {
    val locales = ConfigurationCompat.getLocales(context.resources.configuration)
    return (0 until locales.size()).mapNotNull { locales.get(it)?.toLanguageTag() }
}
