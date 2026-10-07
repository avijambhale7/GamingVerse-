@file:OptIn(ExperimentalMaterial3Api::class)

package com.cropguard.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.data.ScanRecord
import com.cropguard.ai.ui.components.EmptyState

@Composable
fun HistoryScreen(vm: MainViewModel, onOpenRecord: (ScanRecord) -> Unit) {
    val history by vm.history.collectAsStateWithLifecycle()
    var filter by rememberSaveable { mutableIntStateOf(0) } // 0 all, 1 healthy, 2 diseased
    var confirmClear by remember { mutableStateOf(false) }
    val shown = when (filter) {
        1 -> history.filter { it.healthy }
        2 -> history.filterNot { it.healthy }
        else -> history
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.history_title)) },
                actions = {
                    if (history.isNotEmpty()) {
                        IconButton(onClick = { confirmClear = true }) {
                            Icon(Icons.Filled.DeleteSweep, stringResource(R.string.clear_all))
                        }
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    stringResource(R.string.filter_all) + " (${history.size})",
                    stringResource(R.string.stat_healthy) + " (${history.count { it.healthy }})",
                    stringResource(R.string.stat_diseased) + " (${history.count { !it.healthy }})",
                ).forEachIndexed { i, label ->
                    FilterChip(selected = filter == i, onClick = { filter = i }, label = { Text(label) })
                }
            }
            if (shown.isEmpty()) {
                EmptyState(Icons.Filled.History, stringResource(R.string.history_empty))
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(shown, key = { it.id }) { record ->
                        ScanRecordRow(
                            vm, record, onClick = { onOpenRecord(record) },
                            modifier = Modifier.animateItem(),
                            trailing = {
                                IconButton(onClick = { vm.deleteRecord(record.id) }) {
                                    Icon(Icons.Outlined.DeleteOutline, stringResource(R.string.delete))
                                }
                            },
                        )
                    }
                }
            }
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            icon = { Icon(Icons.Filled.DeleteSweep, null) },
            text = { Text(stringResource(R.string.confirm_clear)) },
            confirmButton = {
                TextButton(onClick = { vm.clearHistory(); confirmClear = false }) { Text(stringResource(R.string.clear_all)) }
            },
            dismissButton = {
                TextButton(onClick = { confirmClear = false }) { Text(stringResource(R.string.cancel)) }
            },
        )
    }
}
