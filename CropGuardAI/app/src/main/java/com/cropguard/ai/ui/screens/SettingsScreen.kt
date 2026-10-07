@file:OptIn(ExperimentalMaterial3Api::class)

package com.cropguard.ai.ui.screens

import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.BuildConfig
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.data.ThemeMode
import kotlin.math.roundToInt

@Composable
fun SettingsScreen(vm: MainViewModel) {
    val settings by vm.settings.collectAsStateWithLifecycle()
    val classifier by vm.classifier.collectAsStateWithLifecycle()
    val modelChecked by vm.modelChecked.collectAsStateWithLifecycle()
    var language by remember { mutableStateOf(AppCompatDelegate.getApplicationLocales().toLanguageTags().substringBefore('-')) }

    Scaffold(topBar = { TopAppBar(title = { Text(stringResource(R.string.settings_title)) }) }) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SettingsGroup(stringResource(R.string.settings_appearance), Icons.Filled.Palette) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        ThemeMode.SYSTEM to R.string.theme_system,
                        ThemeMode.LIGHT to R.string.theme_light,
                        ThemeMode.DARK to R.string.theme_dark,
                    ).forEach { (mode, label) ->
                        FilterChip(
                            selected = settings.theme == mode,
                            onClick = { vm.updateSettings { it.copy(theme = mode) } },
                            label = { Text(stringResource(label)) },
                        )
                    }
                }
            }

            SettingsGroup(stringResource(R.string.settings_language), Icons.Filled.Translate) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("" to stringResource(R.string.theme_system), "en" to "English", "hi" to "हिन्दी", "mr" to "मराठी")
                        .forEach { (tag, label) ->
                            FilterChip(
                                selected = language == tag,
                                onClick = {
                                    language = tag
                                    AppCompatDelegate.setApplicationLocales(
                                        if (tag.isEmpty()) LocaleListCompat.getEmptyLocaleList() else LocaleListCompat.forLanguageTags(tag)
                                    )
                                },
                                label = { Text(label) },
                            )
                        }
                }
            }

            SettingsGroup(stringResource(R.string.settings_scanning), Icons.Filled.DocumentScanner) {
                SwitchRow(stringResource(R.string.settings_voice), stringResource(R.string.settings_voice_sub), settings.voice) { v ->
                    vm.updateSettings { it.copy(voice = v) }
                }
                SwitchRow(stringResource(R.string.settings_autosave), null, settings.autoSave) { v ->
                    vm.updateSettings { it.copy(autoSave = v) }
                }
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.settings_threshold, (settings.threshold * 100).roundToInt()), style = MaterialTheme.typography.bodyLarge)
                Text(stringResource(R.string.settings_threshold_sub), style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Slider(
                    value = settings.threshold,
                    onValueChange = { v -> vm.updateSettings { it.copy(threshold = (v * 20).roundToInt() / 20f) } },
                    valueRange = 0.2f..0.9f,
                )
            }

            SettingsGroup(stringResource(R.string.settings_about), Icons.Filled.Info) {
                Text(stringResource(R.string.about_text), style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(10.dp))
                Row {
                    Text(stringResource(R.string.model_status), Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                    val c = classifier
                    Text(
                        when {
                            c != null -> stringResource(R.string.model_loaded, c.classCount)
                            modelChecked -> stringResource(R.string.model_not_loaded)
                            else -> "…"
                        },
                        color = if (c != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
                Text(stringResource(R.string.version, BuildConfig.VERSION_NAME), style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(10.dp))
                Text(stringResource(R.string.disclaimer), style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun SettingsGroup(title: String, icon: ImageVector, content: @Composable ColumnScope.() -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(10.dp))
                Text(title, style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun SwitchRow(title: String, subtitle: String?, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            if (subtitle != null) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Switch(checked = checked, onCheckedChange = onChange)
    }
}
