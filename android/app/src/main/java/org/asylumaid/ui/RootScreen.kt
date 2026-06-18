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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA
import org.asylumaid.ui.theme.AsylumAidTheme

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

/**
 * Sticky "general information, not legal advice" banner — always visible.
 * Styled as a formal legal notice: warning glyph + bold amber text + a strong rule.
 */
@Composable
fun DisclaimerBanner(text: String) {
    Column(Modifier.fillMaxWidth().background(AA.warningBg)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 9.dp),
            horizontalArrangement = Arrangement.spacedBy(9.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Icon(
                Icons.Filled.Warning,
                contentDescription = null,
                tint = AA.warningStrong,
                modifier = Modifier.size(16.dp),
            )
            Text(
                text = text,
                color = AA.warningText,
                fontSize = 12.5.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Box(Modifier.fillMaxWidth().height(3.dp).background(AA.warningStrong))
    }
}

/**
 * App header: institutional navy ground, a serif wordmark with a gold seal emblem,
 * a gold underline, and a language switcher (re-opens the language picker).
 */
@Composable
fun HeaderBar(app: AppViewModel) {
    Column(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(AA.ink2, AA.ink)))) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(Color.White.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center,
            ) {
                Text("⚖", fontSize = 22.sp, color = AA.gold) // scales of justice
            }

            Column(Modifier.weight(1f)) {
                Text(
                    app.t("appTitle"),
                    color = Color.White,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                )
                Text(
                    app.t("appSubtitle").uppercase(),
                    color = Color.White.copy(alpha = 0.78f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 0.5.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.12f))
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
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                )
            }
        }
        Box(Modifier.fillMaxWidth().height(3.dp).background(AA.gold))
    }
}
