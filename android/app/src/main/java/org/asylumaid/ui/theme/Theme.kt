package org.asylumaid.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Brand palette and metrics, ported from the web client's `styles.css` :root tokens. */
object AA {
    val bg = Color(0xFFEEF1F6)
    val surface = Color(0xFFFFFFFF)
    val surfaceAlt = Color(0xFFF6F8FB) // subtle inset surface
    val border = Color(0xFFD2DAE6)
    val borderLight = Color(0xFFE5EAF1)

    val ink = Color(0xFF0C2742)  // institutional navy (header/footer)
    val ink2 = Color(0xFF103253)

    val primary = Color(0xFF16548F) // deep trustworthy blue
    val primaryDark = Color(0xFF0F3D6B)
    val primaryLight = Color(0xFFE2ECF7)

    val gold = Color(0xFFC6A14B) // seal gold (official accent)
    val goldDark = Color(0xFFA8842F)

    val accent = Color(0xFF1F7A4D) // measured green for positive actions
    val accentDark = Color(0xFF155E3A)
    val accentLight = Color(0xFFD9EFE2)

    val warningBg = Color(0xFFFDF6E3)
    val warningBorder = Color(0xFFD4A017)
    val warningStrong = Color(0xFFB07D12)
    val warningText = Color(0xFF6E4F08)

    val errorBg = Color(0xFFFDF1F1)
    val errorBorder = Color(0xFFCF4040)
    val errorText = Color(0xFF8A1C1C)

    val text = Color(0xFF16202E)
    val textMuted = Color(0xFF51607A)

    val chatUserBg = Color(0xFF16548F)
    val chatAiBg = Color(0xFFFFFFFF)
}

object Metrics {
    val radiusSm = 6.dp
    val radiusMd = 10.dp
    val radiusLg = 16.dp
    val radiusXl = 20.dp
}

/**
 * The brand is a light theme (matching web/iOS, which force light). We supply a light
 * Material3 color scheme regardless of the system dark-mode setting.
 */
@Composable
fun AsylumAidTheme(content: @Composable () -> Unit) {
    val colors = lightColorScheme(
        primary = AA.primary,
        onPrimary = Color.White,
        secondary = AA.accent,
        onSecondary = Color.White,
        background = AA.bg,
        onBackground = AA.text,
        surface = AA.surface,
        onSurface = AA.text,
        error = AA.errorBorder,
    )
    MaterialTheme(colorScheme = colors, content = content)
}
