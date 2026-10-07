package com.cropguard.ai.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ThemeMode { SYSTEM, LIGHT, DARK }

data class AppSettings(
    val theme: ThemeMode = ThemeMode.SYSTEM,
    val voice: Boolean = false,
    val autoSave: Boolean = true,
    val threshold: Float = 0.5f,
    val onboarded: Boolean = false,
)

class SettingsRepository(context: Context) {
    private val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)

    private val _settings = MutableStateFlow(read())
    val settings: StateFlow<AppSettings> = _settings.asStateFlow()

    private fun read() = AppSettings(
        theme = runCatching { ThemeMode.valueOf(prefs.getString("theme", null) ?: "SYSTEM") }.getOrDefault(ThemeMode.SYSTEM),
        voice = prefs.getBoolean("voice", false),
        autoSave = prefs.getBoolean("autoSave", true),
        threshold = prefs.getFloat("threshold", 0.5f),
        onboarded = prefs.getBoolean("onboarded", false),
    )

    fun update(transform: (AppSettings) -> AppSettings) {
        val s = transform(_settings.value)
        prefs.edit()
            .putString("theme", s.theme.name)
            .putBoolean("voice", s.voice)
            .putBoolean("autoSave", s.autoSave)
            .putFloat("threshold", s.threshold)
            .putBoolean("onboarded", s.onboarded)
            .apply()
        _settings.value = s
    }
}
