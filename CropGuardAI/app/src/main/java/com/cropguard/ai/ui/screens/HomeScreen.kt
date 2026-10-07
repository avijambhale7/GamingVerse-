package com.cropguard.ai.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.data.ScanRecord
import com.cropguard.ai.ui.components.EmptyState
import com.cropguard.ai.ui.components.SectionTitle
import com.cropguard.ai.ui.components.StatCard
import com.cropguard.ai.ui.theme.Danger
import com.cropguard.ai.ui.theme.Info
import com.cropguard.ai.ui.theme.Leaf
import com.cropguard.ai.ui.theme.LeafDark

@Composable
fun HomeScreen(
    vm: MainViewModel,
    onLiveScan: () -> Unit,
    onAnalyzing: () -> Unit,
    onOpenRecord: (ScanRecord) -> Unit,
    onSeeAllHistory: () -> Unit,
    onOpenCrop: () -> Unit,
) {
    val history by vm.history.collectAsStateWithLifecycle()
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            vm.analyzeUri(uri)
            onAnalyzing()
        }
    }
    val healthy = history.count { it.healthy }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
    ) {
        item {
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                    .background(Brush.linearGradient(listOf(LeafDark, Leaf, Color(0xFF66BB6A))))
                    .statusBarsPadding()
                    .padding(20.dp),
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Spa, null, tint = Color.White, modifier = Modifier.size(28.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.app_name), color = Color.White,
                            style = MaterialTheme.typography.titleLarge)
                    }
                    Spacer(Modifier.height(18.dp))
                    Text(stringResource(R.string.home_greeting), color = Color.White,
                        style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.home_subtitle), color = Color.White.copy(alpha = 0.9f),
                        style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick = onLiveScan,
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = LeafDark),
                    ) {
                        Icon(Icons.Filled.CameraAlt, null)
                        Spacer(Modifier.width(10.dp))
                        Text(stringResource(R.string.action_live_scan), fontSize = 16.sp)
                    }
                    Spacer(Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                        border = BorderStroke(1.dp, Color.White),
                    ) {
                        Icon(Icons.Filled.PhotoLibrary, null)
                        Spacer(Modifier.width(10.dp))
                        Text(stringResource(R.string.action_gallery), fontSize = 16.sp)
                    }
                }
            }
        }

        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                SectionTitle(stringResource(R.string.home_stats_title), Modifier.padding(top = 12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatCard(stringResource(R.string.stat_total_scans), history.size.toString(), Icons.Filled.DocumentScanner, Info, Modifier.weight(1f))
                    StatCard(stringResource(R.string.stat_healthy), healthy.toString(), Icons.Filled.CheckCircle, Leaf, Modifier.weight(1f))
                    StatCard(stringResource(R.string.stat_diseased), (history.size - healthy).toString(), Icons.Filled.Coronavirus, Danger, Modifier.weight(1f))
                }
            }
        }

        item {
            SectionTitle(stringResource(R.string.supported_crops), Modifier.padding(horizontal = 16.dp))
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(vm.diseases.crops) { crop ->
                    AssistChip(
                        onClick = onOpenCrop,
                        label = { Text("${DiseaseRepository.cropEmoji(crop)}  $crop") },
                    )
                }
            }
        }

        item {
            Card(
                Modifier.padding(16.dp).fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Lightbulb, null, tint = MaterialTheme.colorScheme.onTertiaryContainer)
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.home_tips_title), style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onTertiaryContainer)
                    }
                    Spacer(Modifier.height(8.dp))
                    listOf(R.string.tip_1, R.string.tip_2, R.string.tip_3).forEachIndexed { i, tip ->
                        Text("${i + 1}. ${stringResource(tip)}", style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onTertiaryContainer, modifier = Modifier.padding(vertical = 2.dp))
                    }
                }
            }
        }

        item {
            SectionTitle(
                stringResource(R.string.home_recent),
                Modifier.padding(horizontal = 16.dp),
                action = if (history.isNotEmpty()) {
                    { TextButton(onClick = onSeeAllHistory) { Text(stringResource(R.string.see_all)) } }
                } else null,
            )
        }
        if (history.isEmpty()) {
            item { EmptyState(Icons.Filled.Eco, stringResource(R.string.home_no_scans)) }
        } else {
            items(history.take(5), key = { it.id }) { record ->
                ScanRecordRow(vm, record, onClick = { onOpenRecord(record) }, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
            }
        }
    }
}
