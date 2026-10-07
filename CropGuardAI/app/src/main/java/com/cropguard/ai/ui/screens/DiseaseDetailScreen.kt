@file:OptIn(ExperimentalMaterial3Api::class)

package com.cropguard.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.ui.components.TypeBadge
import com.cropguard.ai.util.Speaker

@Composable
fun DiseaseDetailScreen(vm: MainViewModel, label: String, onBack: () -> Unit) {
    val info = remember(label) { vm.diseases.get(label) }
    val context = LocalContext.current
    val speaker = remember { Speaker(context) }
    DisposableEffect(Unit) { onDispose { speaker.shutdown() } }
    val speaking by speaker.speaking.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(info.crop) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, stringResource(R.string.back)) } },
                actions = {
                    IconButton(onClick = {
                        if (speaking) speaker.stop() else speaker.speak(
                            "${info.crop}. ${info.name}. " + info.symptoms.joinToString(". ") + ". " + info.prevention.joinToString(". ")
                        )
                    }) {
                        Icon(if (speaking) Icons.Filled.Stop else Icons.AutoMirrored.Filled.VolumeUp, stringResource(R.string.listen))
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(DiseaseRepository.cropEmoji(info.crop), fontSize = 56.sp)
            Text(info.name, style = MaterialTheme.typography.headlineMedium)
            TypeBadge(info.type)
            if (!info.isHealthy) {
                Text(
                    "${stringResource(R.string.pathogen)}: ${info.pathogen}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            DiseaseKnowledge(info)
            Text(
                stringResource(R.string.disclaimer),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(vertical = 12.dp),
            )
        }
    }
}
