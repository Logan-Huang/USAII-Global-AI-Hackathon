package org.asylumaid.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Brand palette and metrics, ported from the web client's `styles.css` :root tokens. */
object AA {
    val bg = Color(0xFFF5F6F8)
    val surface = Color(0xFFFFFFFF)
    val border = Color(0xFFD8DDE6)
    val borderLight = Color(0xFFE8ECF2)

    val primary = Color(0xFF1D5FA6) // deep trustworthy blue
    val primaryDark = Color(0xFF154D8A)
    val primaryLight = Color(0xFFDCE8F7)

    val accent = Color(0xFF2E7D52) // calm green for positive actions
    val accentDark = Color(0xFF245F3E)
    val accentLight = Color(0xFFD4EDDF)

    val warningBg = Color(0xFFFFF8E6)
    val warningBorder = Color(0xFFE5C000)
    val warningText = Color(0xFF7A5700)

    val errorBg = Color(0xFFFDF2F2)
    val errorBorder = Color(0xFFD94F4F)
    val errorText = Color(0xFF8B1C1C)

    val text = Color(0xFF1A1F2E)
    val textMuted = Color(0xFF4E5868)

    val chatUserBg = Color(0xFF1D5FA6)
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
