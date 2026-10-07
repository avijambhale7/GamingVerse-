@file:OptIn(ExperimentalMaterial3Api::class)

package com.cropguard.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.ui.components.TypeBadge

@Composable
fun LibraryScreen(vm: MainViewModel, onOpenDisease: (String) -> Unit) {
    var query by rememberSaveable { mutableStateOf("") }
    var crop by rememberSaveable { mutableStateOf<String?>(null) }
    val all = vm.diseases.all
    val shown = all.filter { d ->
        (crop == null || d.crop == crop) &&
            (query.isBlank() || listOf(d.name, d.crop, d.type, d.pathogen).any { it.contains(query.trim(), ignoreCase = true) })
    }

    Scaffold(topBar = { TopAppBar(title = { Text(stringResource(R.string.library_title)) }) }) { padding ->
        LazyColumn(
            Modifier.padding(padding).fillMaxSize(),
            contentPadding = PaddingValues(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text(stringResource(R.string.search_hint)) },
                    leadingIcon = { Icon(Icons.Filled.Search, null) },
                    trailingIcon = {
                        if (query.isNotEmpty()) IconButton(onClick = { query = "" }) { Icon(Icons.Filled.Close, null) }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(50),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                )
            }
            item {
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(selected = crop == null, onClick = { crop = null }, label = { Text(stringResource(R.string.filter_all)) })
                    }
                    items(vm.diseases.crops) { c ->
                        FilterChip(
                            selected = crop == c,
                            onClick = { crop = if (crop == c) null else c },
                            label = { Text("${DiseaseRepository.cropEmoji(c)} $c") },
                        )
                    }
                }
            }
            item {
                Text(
                    stringResource(R.string.diseases_count, shown.size),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
            }
            items(shown, key = { it.label }) { d ->
                Card(onClick = { onOpenDisease(d.label) }, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(DiseaseRepository.cropEmoji(d.crop), fontSize = 32.sp)
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(d.crop, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(d.name, style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(4.dp))
                            TypeBadge(d.type)
                        }
                        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null)
                    }
                }
            }
        }
    }
}
