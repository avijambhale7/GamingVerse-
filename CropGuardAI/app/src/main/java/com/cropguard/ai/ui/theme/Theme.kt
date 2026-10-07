package com.cropguard.ai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.cropguard.ai.data.ThemeMode

val Leaf = Color(0xFF2E7D32)
val LeafDark = Color(0xFF1B5E20)
val LeafLight = Color(0xFF81C784)
val Harvest = Color(0xFFFFB300)
val Danger = Color(0xFFE53935)
val Warning = Color(0xFFFB8C00)
val Info = Color(0xFF1E88E5)
val Viral = Color(0xFF8E24AA)

private val LightColors = lightColorScheme(
    primary = Leaf,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFC8E6C9),
    onPrimaryContainer = Color(0xFF0B3D0F),
    secondary = Color(0xFF5D7C2F),
    secondaryContainer = Color(0xFFDDEDC1),
    tertiary = Harvest,
    tertiaryContainer = Color(0xFFFFE8B0),
    background = Color(0xFFF4FAF2),
    surface = Color(0xFFF4FAF2),
    surfaceVariant = Color(0xFFE1EADD),
    surfaceContainer = Color(0xFFEAF2E7),
    surfaceContainerHigh = Color(0xFFE3EDE0),
    error = Danger,
)

private val DarkColors = darkColorScheme(
    primary = LeafLight,
    onPrimary = Color(0xFF00390A),
    primaryContainer = Color(0xFF1E5A24),
    onPrimaryContainer = Color(0xFFC8E6C9),
    secondary = Color(0xFFB8D38E),
    secondaryContainer = Color(0xFF3C4F22),
    tertiary = Color(0xFFFFCA5F),
    tertiaryContainer = Color(0xFF5C4300),
    background = Color(0xFF101510),
    surface = Color(0xFF101510),
    surfaceVariant = Color(0xFF2B352A),
    surfaceContainer = Color(0xFF1A221A),
    surfaceContainerHigh = Color(0xFF232C22),
    error = Color(0xFFFF8A80),
)

private val AppTypography = Typography().run {
    copy(
        headlineMedium = headlineMedium.copy(fontWeight = FontWeight.Bold),
        headlineSmall = headlineSmall.copy(fontWeight = FontWeight.Bold),
        titleLarge = titleLarge.copy(fontWeight = FontWeight.SemiBold),
        titleMedium = titleMedium.copy(fontWeight = FontWeight.SemiBold),
        labelLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 14.sp, letterSpacing = 0.1.sp),
    )
}

@Composable
fun CropGuardTheme(mode: ThemeMode = ThemeMode.SYSTEM, content: @Composable () -> Unit) {
    val dark = when (mode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    MaterialTheme(
        colorScheme = if (dark) DarkColors else LightColors,
        typography = AppTypography,
        content = content,
    )
}

fun typeColor(type: String): Color = when (type.lowercase()) {
    "healthy" -> Leaf
    "fungal" -> Warning
    "oomycete" -> Color(0xFF6D4C41)
    "bacterial" -> Info
    "viral" -> Viral
    "pest" -> Danger
    else -> Color.Gray
}
