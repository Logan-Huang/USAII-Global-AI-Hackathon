package org.asylumaid.ui

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA

/**
 * Full-screen language picker shown on launch and re-openable from the header. Searchable
 * across native + English names, mirroring the web "language gate" and iOS `LanguageGateView`.
 */
@Composable
fun LanguageGateScreen(app: AppViewModel, onDismiss: () -> Unit) {
    var query by remember { mutableStateOf("") }
    val filtered = remember(query) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) app.loc.languages
        else app.loc.languages.filter {
            it.name.lowercase().contains(q) || (it.native ?: "").lowercase().contains(q)
        }
    }

    Surface(Modifier.fillMaxSize(), color = AA.bg) {
        Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
            Text(
                app.t("langGateTitle"),
                color = AA.text,
                fontSize = 18.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            )
            Text(
                app.t("langGateSub"),
                color = AA.textMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 8.dp),
            )
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text(app.t("langGateSearch")) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            )
            Divider(Modifier.padding(top = 8.dp), color = AA.borderLight)

            LazyColumn(Modifier.fillMaxSize()) {
                items(filtered, key = { it.code }) { lang ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickableNoRipple {
                                app.setLanguage(lang.code)
                                onDismiss()
                            }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(lang.displayNative, color = AA.text, fontSize = 16.sp)
                            if (lang.native != null && lang.native != lang.name) {
                                Text(lang.name, color = AA.textMuted, fontSize = 12.sp)
                            }
                        }
                        if (lang.code == app.lang) {
                            Icon(Icons.Filled.Check, contentDescription = null, tint = AA.primary)
                        }
                    }
                    Divider(color = AA.borderLight)
                }
            }
        }
    }
}
