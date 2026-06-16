package org.asylumaid.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.asylumaid.md.Inline
import org.asylumaid.md.MarkdownRenderer
import org.asylumaid.md.MdBlock
import org.asylumaid.model.ChatMessage
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA
import org.asylumaid.ui.theme.Metrics

/** One chat bubble: user (blue, trailing), assistant (white card, leading, markdown), or
 *  an error notice (red). Mirrors the web/iOS bubble styling. */
@Composable
fun MessageBubble(app: AppViewModel, message: ChatMessage) {
    when (message.kind) {
        ChatMessage.Kind.USER -> BubbleRow(Alignment.End, app.t("youLabel")) {
            Text(
                text = message.content,
                color = AA.surface,
                fontSize = 15.sp,
                modifier = Modifier
                    .background(AA.chatUserBg, RoundedCornerShape(Metrics.radiusLg))
                    .padding(horizontal = 13.dp, vertical = 9.dp),
            )
        }

        ChatMessage.Kind.ASSISTANT -> BubbleRow(Alignment.Start, app.t("assistantLabel")) {
            MarkdownText(
                blocks = MarkdownRenderer.render(message.content),
                modifier = Modifier
                    .background(AA.chatAiBg, RoundedCornerShape(Metrics.radiusLg))
                    .border(1.dp, AA.border, RoundedCornerShape(Metrics.radiusLg))
                    .padding(horizontal = 13.dp, vertical = 10.dp),
            )
        }

        ChatMessage.Kind.ERROR -> Row(Modifier.fillMaxWidth()) {
            Text(
                text = message.content,
                color = AA.errorText,
                fontSize = 14.sp,
                modifier = Modifier
                    .background(AA.errorBg, RoundedCornerShape(Metrics.radiusLg))
                    .border(1.dp, AA.errorBorder, RoundedCornerShape(Metrics.radiusLg))
                    .padding(horizontal = 13.dp, vertical = 9.dp),
            )
        }
    }
}

@Composable
private fun BubbleRow(align: Alignment.Horizontal, roleLabel: String, content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = align,
    ) {
        Text(
            text = roleLabel.uppercase(),
            color = AA.textMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 3.dp),
        )
        content()
    }
}

/** Renders parsed markdown blocks. Bold + tappable http(s) links via [AnnotatedString]. */
@Composable
fun MarkdownText(blocks: List<MdBlock>, modifier: Modifier = Modifier) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        for (block in blocks) {
            when (block) {
                is MdBlock.Heading ->
                    Text(inlineAnnotated(block.spans), color = AA.primary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                is MdBlock.Paragraph ->
                    Text(inlineAnnotated(block.spans), color = AA.text, fontSize = 15.sp)
                is MdBlock.OrderedList -> MdList(block.items, ordered = true)
                is MdBlock.UnorderedList -> MdList(block.items, ordered = false)
            }
        }
    }
}

@Composable
private fun MdList(items: List<List<Inline>>, ordered: Boolean) {
    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        items.forEachIndexed { i, spans ->
            Row {
                Text(
                    text = if (ordered) "${i + 1}." else "•",
                    color = AA.textMuted,
                    fontSize = 15.sp,
                    fontWeight = if (ordered) FontWeight.SemiBold else FontWeight.Normal,
                    modifier = Modifier.padding(end = 7.dp),
                )
                Text(inlineAnnotated(spans), color = AA.text, fontSize = 15.sp)
            }
        }
    }
}

private val linkStyles = TextLinkStyles(
    style = SpanStyle(color = AA.primary, textDecoration = TextDecoration.Underline),
)

/** Convert inline runs (text + bold + optional http link) to an [AnnotatedString]. */
private fun inlineAnnotated(spans: List<Inline>): AnnotatedString = buildAnnotatedString {
    for (span in spans) {
        val href = span.href
        if (href != null) {
            withLink(LinkAnnotation.Url(href, linkStyles)) {
                if (span.bold) withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append(span.text) }
                else append(span.text)
            }
        } else if (span.bold) {
            withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append(span.text) }
        } else {
            append(span.text)
        }
    }
}
