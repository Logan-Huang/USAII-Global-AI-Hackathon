package org.asylumaid.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.asylumaid.model.ChatMessage
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA
import org.asylumaid.ui.theme.Metrics

/** Main chat screen: action toolbar, streaming message list, and the input bar. */
@Composable
fun ChatScreen(app: AppViewModel) {
    var input by remember { mutableStateOf("") }
    var showResources by remember { mutableStateOf(false) }
    var showMap by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().background(AA.bg)) {
            Toolbar(app, onResources = { showResources = true }, onMap = { showMap = true })
            Divider(color = AA.border)
            MessageList(app, Modifier.weight(1f))
            InputBar(app, input, onInput = { input = it }, onSend = {
                val text = input; input = ""; app.send(text)
            })
        }
        if (showResources) ResourcesScreen(app) { showResources = false }
        if (showMap) MapScreen(app) { showMap = false }
    }
}

@Composable
private fun Toolbar(app: AppViewModel, onResources: () -> Unit, onMap: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().background(AA.surface)
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 14.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SecondaryButton(app.t("legalHelpButton"), onResources)
        SecondaryButton(app.t("mapButton"), onMap)
        TextButton(onClick = { app.startOver() }) {
            Text(app.t("newSessionButton"), color = AA.textMuted, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun SecondaryButton(label: String, onClick: () -> Unit) {
    Box(
        Modifier
            .border(1.dp, AA.primary.copy(alpha = 0.4f), RoundedCornerShape(Metrics.radiusMd))
            .background(AA.surface, RoundedCornerShape(Metrics.radiusMd))
            .clickableNoRipple(onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(label, color = AA.primary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun MessageList(app: AppViewModel, modifier: Modifier) {
    val listState = rememberLazyListState()
    val lastLen = app.messages.lastOrNull()?.content?.length ?: 0
    val showTyping = app.streaming &&
        app.messages.lastOrNull()?.let { it.kind == ChatMessage.Kind.ASSISTANT && it.content.isEmpty() } == true

    LaunchedEffect(app.messages.size, lastLen, showTyping) {
        val count = app.messages.size + if (showTyping) 1 else 0
        if (count > 0) listState.animateScrollToItem(count - 1)
    }

    LazyColumn(
        state = listState,
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        items(count = app.messages.size, key = { app.messages[it].id }) { i ->
            MessageBubble(app, app.messages[i])
        }
        if (showTyping) {
            item(key = "typing") { TypingIndicator(app.t("typingIndicator")) }
        }
    }
}

@Composable
private fun TypingIndicator(text: String) {
    Row(
        Modifier.background(AA.surface, RoundedCornerShape(Metrics.radiusLg)).padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            repeat(3) {
                Box(Modifier.size(7.dp).background(AA.textMuted, CircleShape))
            }
        }
        Text(text, color = AA.textMuted, fontSize = 13.sp)
    }
}

@Composable
private fun InputBar(app: AppViewModel, input: String, onInput: (String) -> Unit, onSend: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().background(AA.surface).padding(12.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        OutlinedTextField(
            value = input, onValueChange = onInput,
            placeholder = { Text(app.t("inputPlaceholder")) },
            enabled = !app.streaming,
            maxLines = 5,
            modifier = Modifier.weight(1f),
        )
        val canSend = !app.streaming && input.trim().isNotEmpty()
        Button(
            onClick = onSend,
            enabled = canSend,
            colors = ButtonDefaults.buttonColors(
                containerColor = AA.primary, contentColor = AA.surface,
                disabledContainerColor = AA.primary.copy(alpha = 0.5f), disabledContentColor = AA.surface,
            ),
            shape = RoundedCornerShape(Metrics.radiusMd),
        ) {
            Text(if (app.streaming) app.t("sendingButton") else app.t("sendButton"), fontWeight = FontWeight.Bold)
        }
    }
}
