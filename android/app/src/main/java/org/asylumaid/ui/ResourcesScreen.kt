package org.asylumaid.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.asylumaid.model.ResourceLink
import org.asylumaid.model.ResourcesResponse
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA

/**
 * Curated "Find legal help" directory — the authoritative path (the map is secondary).
 * Loads `/api/resources?country=<countryOfAsylum>` and lists Official / Legal aid / Global.
 */
@Composable
fun ResourcesScreen(app: AppViewModel, onClose: () -> Unit) {
    var data by remember { mutableStateOf<ResourcesResponse?>(null) }
    var error by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            data = app.loadResources()
        } catch (e: Throwable) {
            error = true
        }
    }

    Surface(Modifier.fillMaxSize(), color = AA.bg) {
        Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
            OverlayHeader(app.t("resourcesHeading"), app.t("resourcesClose"), onClose)
            Divider(color = AA.borderLight)
            when {
                error -> CenterMessage(app.t("resourcesError"), AA.errorText)
                data == null -> CenterLoading(app.t("resourcesLoading"))
                else -> ResourcesList(app, data!!)
            }
        }
    }
}

@Composable
private fun ResourcesList(app: AppViewModel, data: ResourcesResponse) {
    val uri = LocalUriHandler.current
    val sections = listOf(
        app.t("resourcesOfficial") to (data.official ?: emptyList()),
        app.t("resourcesLegalAid") to (data.legalAid ?: emptyList()),
        app.t("resourcesGlobal") to (data.global ?: emptyList()),
    ).filter { it.second.isNotEmpty() }

    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        item {
            Text(
                "${app.t("resourcesSubheading")} ${app.profile?.countryOfAsylum ?: ""}",
                color = AA.textMuted, fontSize = 13.sp, modifier = Modifier.padding(vertical = 10.dp),
            )
        }
        if (sections.isEmpty()) {
            item { Text(app.t("resourcesNone"), color = AA.textMuted, fontSize = 14.sp) }
        }
        sections.forEach { (title, links) ->
            item {
                Text(title, color = AA.text, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 14.dp, bottom = 4.dp))
            }
            items(links.size, key = { "$title:${links[it].url}:${links[it].name}" }) { idx ->
                ResourceRow(links[idx]) { uri.openUri(it) }
                Divider(color = AA.borderLight)
            }
        }
    }
}

@Composable
private fun ResourceRow(item: ResourceLink, onOpen: (String) -> Unit) {
    Column(
        Modifier.fillMaxWidth().clickable { onOpen(item.url) }.padding(vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Text(item.name, color = AA.primary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        item.description?.takeIf { it.isNotEmpty() }?.let {
            Text(it, color = AA.textMuted, fontSize = 13.sp)
        }
    }
}

@Composable
fun OverlayHeader(title: String, closeDescription: String, onClose: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(start = 16.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, color = AA.text, fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
        IconButton(onClick = onClose) {
            Icon(Icons.Filled.Close, contentDescription = closeDescription, tint = AA.textMuted)
        }
    }
}

@Composable
fun CenterLoading(text: String) {
    Column(
        Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CircularProgressIndicator(color = AA.primary)
        Text(text, color = AA.textMuted, fontSize = 14.sp, modifier = Modifier.padding(top = 12.dp))
    }
}

@Composable
fun CenterMessage(text: String, color: androidx.compose.ui.graphics.Color) {
    Column(
        Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text, color = color, fontSize = 14.sp, modifier = Modifier.padding(16.dp))
    }
}
