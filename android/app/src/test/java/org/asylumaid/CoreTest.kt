package org.asylumaid

import org.asylumaid.i18n.LocalizationStore
import org.asylumaid.md.MarkdownRenderer
import org.asylumaid.md.MdBlock
import org.asylumaid.model.ChatMessage
import org.asylumaid.model.Place
import org.asylumaid.model.Profile
import org.asylumaid.model.StreamEvent
import org.asylumaid.model.toWire
import org.asylumaid.net.appJson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Pure-JVM unit tests for the Foundation-of-the-app logic — the Android analogue of
 * `ios/CoreTests/main.swift`. Runs with `./gradlew test` (no emulator / Android SDK).
 * Reads the bundled assets straight from the source tree (the unit-test working dir is
 * the `app/` module directory).
 */
class CoreTest {

    private val store: LocalizationStore by lazy {
        val strings = File("src/main/assets/strings.json").readText()
        val langs = File("src/main/assets/languages.json").readText()
        LocalizationStore.fromJson(strings, langs)
    }

    private fun spansText(spans: List<org.asylumaid.md.Inline>) = spans.joinToString("") { it.text }

    // MARK: - LocalizationStore

    @Test fun localization_fallback_and_rtl() {
        assertEquals("languages.json has 100 entries", 100, store.languages.size)
        assertEquals("Get guidance", store.t("en", "submitButton"))
        assertTrue("so differs from en (translated)", store.t("so", "submitButton") != store.t("en", "submitButton"))
        assertEquals("unknown lang falls back to en", store.t("en", "submitButton"), store.t("zz", "submitButton"))
        assertEquals("missing key returns the key", "totally_missing_key", store.t("en", "totally_missing_key"))
        assertTrue("ar/ps/he are RTL", store.isRtl("ar") && store.isRtl("ps") && store.isRtl("he"))
        assertFalse("en/es are not RTL", store.isRtl("en") || store.isRtl("es"))
    }

    @Test fun detectLanguage_prefers_supported() {
        assertEquals("es", store.detectLanguage(listOf("es-MX", "en-US")))
        assertEquals("en", store.detectLanguage(listOf("zz-ZZ")))
        assertEquals("en", store.detectLanguage(emptyList()))
    }

    // MARK: - buildInitialMessage

    @Test fun buildInitialMessage_full_and_minimal() {
        val full = Profile("Afghanistan", "United States", "New York, USA", "Female", "Single", "I arrived two weeks ago.")
        val msg = store.buildInitialMessage("en", full)
        assertFalse("no leftover {placeholders}", msg.contains("{"))
        assertTrue(msg.contains("Afghanistan") && msg.contains("United States") && msg.contains("New York, USA"))
        assertTrue(msg.contains("My gender is Female.") && msg.contains("My civil status is Single."))
        assertTrue(msg.contains("I arrived two weeks ago."))

        val min = Profile("Syria", "Germany", "Berlin", null, null, null)
        val minMsg = store.buildInitialMessage("en", min)
        assertFalse(minMsg.contains("{"))
        assertFalse("minimal omits gender line", minMsg.lowercase().contains("my gender is"))
        assertTrue("es template differs from en", store.buildInitialMessage("es", min) != minMsg)
        assertTrue("country name filled verbatim (English)", store.buildInitialMessage("es", min).contains("Syria"))
    }

    // MARK: - MarkdownRenderer

    @Test fun markdown_ordered_list_survives_blank_line() {
        val blocks = MarkdownRenderer.render("1. First\n2. Second\n\n3. Third\n\nFor more info see below.")
        val first = blocks.first()
        assertTrue("first block is an ordered list", first is MdBlock.OrderedList)
        assertEquals("3 items kept across the blank line", 3, (first as MdBlock.OrderedList).items.size)
        assertEquals("list + trailing paragraph", 2, blocks.size)
        assertTrue("trailing block is a paragraph", blocks.last() is MdBlock.Paragraph)
    }

    @Test fun markdown_heading_bold_links() {
        assertTrue(MarkdownRenderer.render("## Next steps\nDo this.").first() is MdBlock.Heading)

        val bold = MarkdownRenderer.renderInline("This is **important** text")
        assertTrue("a bold run is present", bold.any { it.bold })
        assertEquals("bold markers stripped", "This is important text", spansText(bold))

        val link = MarkdownRenderer.renderInline("See [UNHCR](https://help.unhcr.org/) now")
        assertTrue("http link href present", link.any { it.href == "https://help.unhcr.org/" })
        assertEquals("link renders label text", "See UNHCR now", spansText(link))

        val bad = MarkdownRenderer.renderInline("Bad [x](ftp://evil.test) link")
        assertFalse("non-http link dropped", bad.any { it.href != null })
        assertEquals("non-http link keeps label only", "Bad x link", spansText(bad))
    }

    // MARK: - Wire models / JSON contracts

    @Test fun profile_omits_null_optionals() {
        val min = Profile("Syria", "Germany", "Berlin", null, null, null)
        val json = appJson.encodeToString(min)
        assertFalse("nil optional profile fields are omitted", json.contains("gender"))
        val full = Profile("Afghanistan", "United States", "NYC", "Female", "Single", "note")
        assertTrue("set optional fields are encoded", appJson.encodeToString(full).contains("\"gender\":\"Female\""))
    }

    @Test fun ndjson_events_decode() {
        val lines = listOf(
            """{"type":"delta","text":"Hello "}""",
            """{"type":"delta","text":"world"}""",
            """{"type":"done"}""",
            """{"type":"error","message":"boom"}""",
        )
        val decoded = lines.map { appJson.decodeFromString<StreamEvent>(it) }
        assertEquals(4, decoded.size)
        assertEquals("delta", decoded[0].type); assertEquals("Hello ", decoded[0].text)
        assertEquals("error", decoded[3].type); assertEquals("boom", decoded[3].message)
    }

    @Test fun place_tolerates_missing_optionals() {
        val place = appJson.decodeFromString<Place>("""{"name":"Refugee Center","lat":40.7,"lon":-74.0,"category":"NGO"}""")
        assertTrue(place.phone.isEmpty() && place.website.isEmpty() && place.address.isEmpty())
        assertEquals("NGO", place.category)
    }

    @Test fun wire_history_excludes_errors() {
        val history = listOf(
            ChatMessage(ChatMessage.Kind.USER, "hi"),
            ChatMessage(ChatMessage.Kind.ASSISTANT, "hello"),
            ChatMessage(ChatMessage.Kind.ERROR, "network error"),
        )
        val wire = history.toWire()
        assertEquals("error bubbles excluded from wire history", 2, wire.size)
        assertEquals("wire history preserves roles", "assistant", wire.last().role)
    }
}
