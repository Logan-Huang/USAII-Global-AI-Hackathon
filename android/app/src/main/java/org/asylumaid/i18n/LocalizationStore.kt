package org.asylumaid.i18n

import org.asylumaid.model.Language
import org.asylumaid.model.LanguagesFile
import org.asylumaid.model.Profile
import org.asylumaid.net.appJson

/**
 * Loads the bundled UI-string table (`strings.json`, all 100 languages × keys) and the
 * canonical language list (`languages.json`), and resolves strings with the same fallback
 * chain as the web client's `i18n.t`:
 *
 *     strings[lang][key] ?? strings["en"][key] ?? key
 *
 * Pure Kotlin (no Android dependency) so the logic is unit-testable on the JVM — the
 * Android asset loading lives in [loadLocalizationFromAssets]. Mirrors iOS `LocalizationStore`.
 */
class LocalizationStore(
    private val strings: Map<String, Map<String, String>>,
    val languages: List<Language>,
) {
    private val supported: Set<String> = strings.keys
    private val rtlCodes: Set<String> =
        languages.filter { it.isRtlFlagged }.map { it.code }.toSet() + "ar"

    /** Translate a key for a language, falling back to English then the key itself. */
    fun t(lang: String, key: String): String =
        strings[lang]?.get(key) ?: strings["en"]?.get(key) ?: key

    fun isRtl(lang: String): Boolean = rtlCodes.contains(lang)

    fun language(code: String): Language? = languages.firstOrNull { it.code == code }

    /**
     * Best supported language from the device preferences, else "en" (mirrors detectLanguage).
     * `preferred` is the device's ordered language tags (e.g. ["es-MX", "en-US"]).
     */
    fun detectLanguage(preferred: List<String>): String {
        for (pref in preferred) {
            val base = pref.lowercase().substringBefore('-')
            if (supported.contains(base)) return base
        }
        return "en"
    }

    /**
     * Compose the first user message from the profile, in the chosen language.
     * Direct port of `i18n.buildInitialMessage`.
     */
    fun buildInitialMessage(lang: String, profile: Profile): String {
        val genderLine = if (!profile.gender.isNullOrEmpty())
            t(lang, "genderLine").replace("{gender}", profile.gender) else ""
        val civilLine = if (!profile.civilStatus.isNullOrEmpty())
            t(lang, "civilStatusLine").replace("{civilStatus}", profile.civilStatus) else ""
        val notes = if (!profile.notes.isNullOrEmpty()) profile.notes + " " else ""

        return t(lang, "initialMessageTemplate")
            .replace("{countryOfOrigin}", profile.countryOfOrigin)
            .replace("{countryOfAsylum}", profile.countryOfAsylum)
            .replace("{currentLocation}", profile.currentLocation)
            .replace("{genderLine}", genderLine)
            .replace("{civilStatusLine}", civilLine)
            .replace("{notes}", notes)
    }

    companion object {
        /** Build from raw JSON text (used by the app's asset loader and by unit tests). */
        fun fromJson(stringsJson: String, languagesJson: String): LocalizationStore {
            val strings: Map<String, Map<String, String>> = appJson.decodeFromString(stringsJson)
            val langs = appJson.decodeFromString<LanguagesFile>(languagesJson).languages
            return LocalizationStore(strings, langs)
        }
    }
}
