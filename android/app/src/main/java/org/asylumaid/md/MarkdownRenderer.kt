package org.asylumaid.md

/** An inline run of text with optional bold + an optional http(s) link target. */
data class Inline(val text: String, val bold: Boolean = false, val href: String? = null)

/**
 * A block of rendered markdown. The Compose layer lays these out; the parsing here is pure
 * Kotlin (no Android/Compose types) so it is unit-testable on the JVM.
 */
sealed interface MdBlock {
    data class Heading(val spans: List<Inline>) : MdBlock
    data class Paragraph(val spans: List<Inline>) : MdBlock
    data class OrderedList(val items: List<List<Inline>>) : MdBlock
    data class UnorderedList(val items: List<List<Inline>>) : MdBlock
}

/**
 * Safe, minimal markdown — a faithful port of the web client's `renderMarkdown` and iOS
 * `MarkdownRenderer`. Supports: `## H2`, ordered (`1.`) and unordered (`-`/`*`) lists,
 * `**bold**`, and `[text](http(s)://url)` links. Everything else is plain text. No HTML is
 * produced, so there's no injection surface; link URLs are restricted to http/https.
 *
 * Critically, blank lines *inside* a list of the same type do NOT break the list — otherwise
 * an ordered list would restart numbering at "1." after every gap.
 */
object MarkdownRenderer {

    private val HEADING = Regex("^##\\s+(.+)$")
    private val ORDERED = Regex("^\\s*\\d+\\.\\s+(.+)$")
    private val UNORDERED = Regex("^\\s*[-*]\\s+(.+)$")
    private val LINK = Regex("\\[([^\\]]+)\\]\\(([^)]+)\\)")
    private val BOLD = Regex("\\*\\*([^*\\n]+)\\*\\*")
    private val HTTP = Regex("^https?://", RegexOption.IGNORE_CASE)

    private enum class ListType { ORDERED, UNORDERED }

    fun render(raw: String): List<MdBlock> {
        val lines = raw.split("\n")
        val blocks = mutableListOf<MdBlock>()

        var listType: ListType? = null
        var listItems = mutableListOf<List<Inline>>()

        fun closeList() {
            val lt = listType ?: return
            blocks.add(if (lt == ListType.ORDERED) MdBlock.OrderedList(listItems) else MdBlock.UnorderedList(listItems))
            listItems = mutableListOf()
            listType = null
        }

        var i = 0
        while (i < lines.size) {
            val line = lines[i]
            val heading = HEADING.find(line)
            val ordered = ORDERED.find(line)
            val unordered = UNORDERED.find(line)
            when {
                heading != null -> {
                    closeList()
                    blocks.add(MdBlock.Heading(renderInline(heading.groupValues[1])))
                }
                ordered != null -> {
                    if (listType != ListType.ORDERED) { closeList(); listType = ListType.ORDERED }
                    listItems.add(renderInline(ordered.groupValues[1]))
                }
                unordered != null -> {
                    if (listType != ListType.UNORDERED) { closeList(); listType = ListType.UNORDERED }
                    listItems.add(renderInline(unordered.groupValues[1]))
                }
                line.isBlank() -> {
                    // Keep the list open if it resumes after the blank line(s).
                    val lt = listType
                    if (lt != null) {
                        var j = i + 1
                        while (j < lines.size && lines[j].isBlank()) j++
                        val resumes = j < lines.size &&
                            ((lt == ListType.ORDERED && ORDERED.containsMatchIn(lines[j])) ||
                                (lt == ListType.UNORDERED && UNORDERED.containsMatchIn(lines[j])))
                        if (!resumes) closeList()
                    }
                }
                else -> {
                    closeList()
                    blocks.add(MdBlock.Paragraph(renderInline(line)))
                }
            }
            i++
        }
        closeList()
        return blocks
    }

    // MARK: - Inline (links + bold)

    /** Parse links first, then bold within the surrounding text (mirrors web order). */
    fun renderInline(text: String): List<Inline> {
        val out = mutableListOf<Inline>()
        var last = 0
        for (m in LINK.findAll(text)) {
            if (m.range.first > last) out += renderBold(text.substring(last, m.range.first))
            val label = m.groupValues[1]
            val url = m.groupValues[2]
            if (HTTP.containsMatchIn(url)) {
                out += renderBold(label).map { it.copy(href = url) }
            } else {
                // Non-http link: drop the URL, keep the visible text (matches web).
                out += renderBold(label)
            }
            last = m.range.last + 1
        }
        if (last < text.length) out += renderBold(text.substring(last))
        return out.ifEmpty { listOf(Inline("")) }
    }

    private fun renderBold(text: String): List<Inline> {
        val out = mutableListOf<Inline>()
        var last = 0
        for (m in BOLD.findAll(text)) {
            if (m.range.first > last) out += Inline(text.substring(last, m.range.first))
            out += Inline(m.groupValues[1], bold = true)
            last = m.range.last + 1
        }
        if (last < text.length) out += Inline(text.substring(last))
        return out
    }
}
