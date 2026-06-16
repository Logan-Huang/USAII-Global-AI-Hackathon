package org.asylumaid.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Language
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA
import org.asylumaid.ui.theme.AsylumAidTheme
import org.asylumaid.ui.theme.Metrics

@Composable
fun RootScreen(app: AppViewModel) {
    AsylumAidTheme {
        RtlBox(app) {
            Box(Modifier.fillMaxSize().background(AA.bg)) {
                Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
                    DisclaimerBanner(app.t("disclaimer"))
                    HeaderBar(app)
                    when (app.stage) {
                        AppViewModel.Stage.INTAKE -> IntakeFormScreen(app)
                        AppViewModel.Stage.CHAT -> ChatScreen(app)
                    }
                }
                if (app.showLangGate) {
                    LanguageGateScreen(app, onDismiss = { app.showLangGate = false })
                }
            }
        }
    }
}

/** Sticky "general information, not legal advice" banner — always visible. */
@Composable
fun DisclaimerBanner(text: String) {
    Text(
        text = text,
        color = AA.warningText,
        fontSize = 12.5.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier
            .fillMaxWidth()
            .background(AA.warningBg)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

/** App header with brand + a language switcher (re-opens the language picker). */
@Composable
fun HeaderBar(app: AppViewModel) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(AA.primary)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(Metrics.radiusSm))
                .background(Color.White.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center,
        ) {
            Text("⛺", fontSize = 22.sp) // shelter / tent glyph
        }

        Column(Modifier.weight(1f)) {
            Text(app.t("appTitle"), color = Color.White, fontSize = 17.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
            Text(
                app.t("appSubtitle"),
                color = Color.White.copy(alpha = 0.85f),
                fontSize = 11.5.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.15f))
                .clickableNoRipple { app.showLangGate = true }
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            Icon(Icons.Filled.Language, contentDescription = app.t("languageLabel"), tint = Color.White, modifier = Modifier.size(16.dp))
            Text(
                app.loc.language(app.lang)?.displayNative ?: app.lang,
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                maxLines = 1,
            )
        }
    }
}
