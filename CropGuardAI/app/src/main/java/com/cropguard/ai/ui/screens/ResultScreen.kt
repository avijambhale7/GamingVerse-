@file:OptIn(ExperimentalMaterial3Api::class)

package com.cropguard.ai.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.AnalysisResult
import com.cropguard.ai.AnalysisState
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.ResultStatus
import com.cropguard.ai.data.DiseaseInfo
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.ui.components.*
import com.cropguard.ai.ui.theme.*
import com.cropguard.ai.util.ReportExporter
import com.cropguard.ai.util.Speaker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.math.roundToInt

@Composable
fun ResultScreen(vm: MainViewModel, onBack: () -> Unit, onOpenDisease: (String) -> Unit) {
    val state by vm.analysis.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val speaker = remember { Speaker(context) }
    DisposableEffect(Unit) { onDispose { speaker.shutdown() } }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.result_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, stringResource(R.string.back)) }
                },
            )
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (val s = state) {
                AnalysisState.Idle, AnalysisState.Loading -> AnalyzingIndicator()
                is AnalysisState.Error -> EmptyState(Icons.Filled.BrokenImage, s.message, Modifier.align(Alignment.Center))
                is AnalysisState.Done -> ResultContent(vm, s.result, speaker, onOpenDisease)
            }
        }
    }
}

@Composable
private fun AnalyzingIndicator() {
    val transition = rememberInfiniteTransition(label = "pulse")
    val scale by transition.animateFloat(
        initialValue = 0.85f, targetValue = 1.1f,
        animationSpec = infiniteRepeatable(tween(700, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "scale",
    )
    Column(
        Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            Modifier.size(110.dp).scale(scale).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.Spa, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(56.dp))
        }
        Spacer(Modifier.height(24.dp))
        Text(stringResource(R.string.analyzing), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(6.dp))
        Text(stringResource(R.string.analyzing_sub), style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(20.dp))
        LinearProgressIndicator(Modifier.width(180.dp).clip(RoundedCornerShape(50)))
    }
}

@Composable
private fun ResultContent(vm: MainViewModel, result: AnalysisResult, speaker: Speaker, onOpenDisease: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val settings by vm.settings.collectAsStateWithLifecycle()
    val speaking by speaker.speaking.collectAsStateWithLifecycle()
    var showHeatmap by rememberSaveable { mutableStateOf(false) }
    val top = result.top
    val info: DiseaseInfo? = top?.second
    val severity = result.severity
    val severityText = severityLabel(severity)

    val headline = when {
        result.status == ResultStatus.NO_LEAF -> stringResource(R.string.result_no_leaf)
        result.isHealthy -> stringResource(R.string.result_healthy)
        else -> stringResource(R.string.result_diseased)
    }
    val speech = remember(result, info) {
        if (info == null) headline else buildString {
            append("${info.crop}. ${info.name}. ")
            if (!info.isHealthy) {
                append("Severity: $severityText. ")
                info.organic.firstOrNull()?.let { append("Recommended: $it. ") }
                info.prevention.firstOrNull()?.let { append("Prevention: $it.") }
            }
        }
    }
    LaunchedEffect(result) {
        if (settings.voice && result.status != ResultStatus.NO_LEAF) speaker.speak(speech)
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Image with original / heatmap toggle
        Card(shape = RoundedCornerShape(20.dp)) {
            Box {
                Image(
                    bitmap = (if (showHeatmap) result.leaf.heatmap else result.image).asImageBitmap(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().aspectRatio(1.2f),
                )
                Row(
                    Modifier.align(Alignment.BottomCenter).padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    FilterChip(
                        selected = !showHeatmap, onClick = { showHeatmap = false },
                        label = { Text(stringResource(R.string.result_original)) },
                        colors = FilterChipDefaults.filterChipColors(containerColor = MaterialTheme.colorScheme.surface),
                    )
                    FilterChip(
                        selected = showHeatmap, onClick = { showHeatmap = true },
                        label = { Text(stringResource(R.string.result_heatmap)) },
                        leadingIcon = { Icon(Icons.Filled.Layers, null, Modifier.size(18.dp)) },
                        colors = FilterChipDefaults.filterChipColors(containerColor = MaterialTheme.colorScheme.surface),
                    )
                }
            }
        }

        when (result.status) {
            ResultStatus.NO_MODEL -> Banner(stringResource(R.string.model_missing), Warning, Icons.Filled.Warning)
            ResultStatus.UNCERTAIN -> Banner(stringResource(R.string.result_uncertain), Warning, Icons.AutoMirrored.Filled.HelpOutline)
            ResultStatus.NO_LEAF -> Banner(stringResource(R.string.result_no_leaf), Danger, Icons.Filled.SearchOff)
            ResultStatus.CONFIDENT -> Unit
        }

        // Main diagnosis card
        if (top != null && info != null && result.status != ResultStatus.NO_LEAF) {
            val color = if (info.isHealthy) Leaf else Danger
            Card(colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f))) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(if (info.isHealthy) Icons.Filled.CheckCircle else Icons.Filled.Coronavirus, null, tint = color)
                        Spacer(Modifier.width(8.dp))
                        Text(headline, color = color, style = MaterialTheme.typography.labelLarge)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("${DiseaseRepository.cropEmoji(info.crop)} ${info.crop}", style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(info.name, style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TypeBadge(info.type)
                        if (!info.isHealthy) {
                            Spacer(Modifier.width(8.dp))
                            Text(info.pathogen, style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Row {
                        Text(stringResource(R.string.result_confidence), Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                        Text("${(top.first.confidence * 100).roundToInt()}%", fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(6.dp))
                    ConfidenceBar(top.first.confidence, color)
                }
            }
        }

        // Severity / leaf health
        if (result.status != ResultStatus.NO_LEAF) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.result_severity), Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
                        Text(
                            severityText,
                            color = severityColor(severity),
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clip(RoundedCornerShape(50))
                                .background(severityColor(severity).copy(alpha = 0.14f))
                                .padding(horizontal = 12.dp, vertical = 4.dp),
                        )
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Metric(stringResource(R.string.result_affected_area), "${(result.leaf.affectedRatio * 100).roundToInt()}%",
                            result.leaf.affectedRatio, severityColor(severity), Modifier.weight(1f))
                        Metric(stringResource(R.string.result_health_score), "${result.leaf.healthScore}/100",
                            result.leaf.healthScore / 100f, Leaf, Modifier.weight(1f))
                    }
                }
            }
        }

        // Alternatives
        if (result.predictions.size > 1 && result.status != ResultStatus.NO_LEAF) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
                Column(Modifier.padding(16.dp)) {
                    Text(stringResource(R.string.result_other_possibilities), style = MaterialTheme.typography.titleMedium)
                    result.predictions.drop(1).forEach { (p, i) ->
                        Spacer(Modifier.height(10.dp))
                        Row {
                            Text("${i.crop} — ${i.name}", Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                            Text("${(p.confidence * 100).roundToInt()}%", style = MaterialTheme.typography.bodyMedium)
                        }
                        Spacer(Modifier.height(4.dp))
                        ConfidenceBar(p.confidence, MaterialTheme.colorScheme.secondary)
                    }
                }
            }
        }

        // Actions
        if (top != null && info != null && result.status != ResultStatus.NO_LEAF) {
            val report = ReportExporter.Report(result.image, result.leaf.heatmap, info, top.first.confidence,
                result.leaf.affectedRatio, severityText, result.timestamp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilledTonalButton(
                    onClick = { if (speaking) speaker.stop() else speaker.speak(speech) },
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp),
                ) {
                    Icon(if (speaking) Icons.Filled.Stop else Icons.AutoMirrored.Filled.VolumeUp, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(stringResource(if (speaking) R.string.stop else R.string.listen), maxLines = 1)
                }
                FilledTonalButton(
                    onClick = { ReportExporter.shareText(context, report) },
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp),
                ) {
                    Icon(Icons.Filled.Share, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(stringResource(R.string.share), maxLines = 1)
                }
                FilledTonalButton(
                    onClick = {
                        scope.launch {
                            val file = withContext(Dispatchers.IO) { runCatching { ReportExporter.exportPdf(context, report) }.getOrNull() }
                            if (file != null) ReportExporter.sharePdf(context, file)
                            else Toast.makeText(context, "PDF export failed", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp),
                ) {
                    Icon(Icons.Filled.PictureAsPdf, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(stringResource(R.string.export_pdf), maxLines = 1)
                }
            }

            DiseaseKnowledge(info)

            OutlinedButton(onClick = { onOpenDisease(info.label) }, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.AutoMirrored.Filled.MenuBook, null, Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.view_in_library))
            }
        }

        Text(
            stringResource(R.string.disclaimer),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(vertical = 12.dp),
        )
    }
}

@Composable
private fun Metric(label: String, value: String, progress: Float, color: androidx.compose.ui.graphics.Color, modifier: Modifier) {
    Column(modifier) {
        Text(value, style = MaterialTheme.typography.headlineSmall, color = color)
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(6.dp))
        ConfidenceBar(progress, color)
    }
}

/** Symptoms / causes / treatment / prevention cards - shared with the disease detail screen. */
@Composable
fun DiseaseKnowledge(info: DiseaseInfo) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        InfoSection(stringResource(R.string.symptoms), Icons.Filled.Visibility, info.symptoms, Warning)
        InfoSection(stringResource(R.string.causes), Icons.Filled.BugReport, info.causes, Danger)
        InfoSection(stringResource(R.string.organic_treatment), Icons.Filled.Eco, info.organic, Leaf)
        InfoSection(stringResource(R.string.chemical_treatment), Icons.Filled.Science, info.chemical, Info)
        InfoSection(stringResource(R.string.prevention), Icons.Filled.Shield, info.prevention, Viral)
    }
}
