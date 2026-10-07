@file:OptIn(ExperimentalMaterial3Api::class)

package com.cropguard.ai.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.ml.RiskCalculator
import com.cropguard.ai.ui.components.ConfidenceBar
import com.cropguard.ai.ui.components.EmptyState
import com.cropguard.ai.ui.components.StatCard
import com.cropguard.ai.ui.theme.Danger
import com.cropguard.ai.ui.theme.Harvest
import com.cropguard.ai.ui.theme.Info
import com.cropguard.ai.ui.theme.Leaf
import com.cropguard.ai.ui.theme.Warning
import kotlin.math.roundToInt

@Composable
fun InsightsScreen(vm: MainViewModel) {
    val history by vm.history.collectAsStateWithLifecycle()
    Scaffold(topBar = { TopAppBar(title = { Text(stringResource(R.string.insights_title)) }) }) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            WeatherRiskCard()

            if (history.isEmpty()) {
                EmptyState(Icons.Filled.Insights, stringResource(R.string.no_data))
            } else {
                val healthy = history.count { it.healthy }
                val diseased = history.size - healthy
                val diseasedRecords = history.filterNot { it.healthy }
                val avgAffected = if (diseasedRecords.isEmpty()) 0f else diseasedRecords.map { it.affectedRatio }.average().toFloat()

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatCard(stringResource(R.string.stat_total_scans), history.size.toString(), Icons.Filled.DocumentScanner, Info, Modifier.weight(1f))
                    StatCard(stringResource(R.string.insights_avg_severity), "${(avgAffected * 100).roundToInt()}%", Icons.Filled.Coronavirus, Warning, Modifier.weight(1f))
                }

                ChartCard(stringResource(R.string.insights_distribution)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Donut(healthy.toFloat(), diseased.toFloat(), Modifier.size(120.dp))
                        Spacer(Modifier.width(20.dp))
                        Column {
                            Legend(Leaf, stringResource(R.string.stat_healthy), healthy, history.size)
                            Spacer(Modifier.height(8.dp))
                            Legend(Danger, stringResource(R.string.stat_diseased), diseased, history.size)
                        }
                    }
                }

                val topDiseases = diseasedRecords.groupingBy { it.label }.eachCount().entries.sortedByDescending { it.value }.take(5)
                if (topDiseases.isNotEmpty()) {
                    ChartCard(stringResource(R.string.insights_top_diseases)) {
                        val max = topDiseases.first().value.toFloat()
                        topDiseases.forEach { (label, count) ->
                            val info = vm.diseases.get(label)
                            BarRow("${info.crop} — ${info.name}", count, count / max, Danger)
                        }
                    }
                }

                val crops = history.groupingBy { vm.diseases.get(it.label).crop }.eachCount().entries.sortedByDescending { it.value }
                ChartCard(stringResource(R.string.insights_crops)) {
                    val max = crops.first().value.toFloat()
                    crops.forEach { (crop, count) ->
                        BarRow("${DiseaseRepository.cropEmoji(crop)} $crop", count, count / max, Leaf)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun WeatherRiskCard() {
    var temp by rememberSaveable { mutableFloatStateOf(24f) }
    var humidity by rememberSaveable { mutableFloatStateOf(80f) }
    var wet by rememberSaveable { mutableStateOf(true) }
    val risks = remember(temp, humidity, wet) { RiskCalculator.calculate(temp, humidity, wet) }

    ChartCard(stringResource(R.string.risk_title), icon = Icons.Filled.Thermostat) {
        Text(stringResource(R.string.risk_subtitle), style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(10.dp))
        Text(stringResource(R.string.temperature, temp.roundToInt()), style = MaterialTheme.typography.labelLarge)
        Slider(value = temp, onValueChange = { temp = it }, valueRange = 0f..45f)
        Text(stringResource(R.string.humidity, humidity.roundToInt()), style = MaterialTheme.typography.labelLarge)
        Slider(value = humidity, onValueChange = { humidity = it }, valueRange = 0f..100f)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.WaterDrop, null, tint = Info)
            Spacer(Modifier.width(8.dp))
            Text(stringResource(R.string.leaf_wetness), Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            Switch(checked = wet, onCheckedChange = { wet = it })
        }
        Spacer(Modifier.height(8.dp))
        risks.take(5).forEach { r ->
            val (label, color) = when {
                r.score >= 0.66f -> stringResource(R.string.risk_high) to Danger
                r.score >= 0.33f -> stringResource(R.string.risk_medium) to Harvest
                else -> stringResource(R.string.risk_low) to Leaf
            }
            Column(Modifier.padding(vertical = 5.dp)) {
                Row {
                    Column(Modifier.weight(1f)) {
                        Text(r.disease, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                        Text(r.crops, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(label, color = color, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(4.dp))
                ConfidenceBar(r.score, color)
            }
        }
    }
}

@Composable
private fun ChartCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (icon != null) {
                    Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(8.dp))
                }
                Text(title, style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun Donut(healthy: Float, diseased: Float, modifier: Modifier) {
    val total = (healthy + diseased).coerceAtLeast(1f)
    val track = MaterialTheme.colorScheme.surfaceVariant
    Box(modifier, contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val stroke = Stroke(width = size.minDimension * 0.16f, cap = StrokeCap.Butt)
            val inset = stroke.width / 2
            val arcSize = androidx.compose.ui.geometry.Size(size.width - stroke.width, size.height - stroke.width)
            val topLeft = androidx.compose.ui.geometry.Offset(inset, inset)
            drawArc(track, 0f, 360f, false, topLeft, arcSize, style = stroke)
            val healthySweep = 360f * healthy / total
            drawArc(Leaf, -90f, healthySweep, false, topLeft, arcSize, style = stroke)
            drawArc(Danger, -90f + healthySweep, 360f * diseased / total, false, topLeft, arcSize, style = stroke)
        }
        Text("${(healthy / total * 100).roundToInt()}%", style = MaterialTheme.typography.titleLarge, color = Leaf)
    }
}

@Composable
private fun Legend(color: Color, label: String, count: Int, total: Int) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Canvas(Modifier.size(12.dp)) { drawCircle(color) }
        Spacer(Modifier.width(8.dp))
        Text("$label: $count (${if (total == 0) 0 else count * 100 / total}%)", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun BarRow(label: String, count: Int, fraction: Float, color: Color) {
    Column(Modifier.padding(vertical = 5.dp)) {
        Row {
            Text(label, Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            Text(count.toString(), fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(4.dp))
        ConfidenceBar(fraction, color)
    }
}
