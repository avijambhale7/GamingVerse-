package com.cropguard.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.data.ScanRecord
import com.cropguard.ai.ui.theme.Danger
import com.cropguard.ai.ui.theme.Leaf
import java.io.File
import java.text.DateFormat
import java.util.Date
import kotlin.math.roundToInt

@Composable
fun ScanRecordRow(
    vm: MainViewModel,
    record: ScanRecord,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    trailing: (@Composable () -> Unit)? = null,
) {
    val info = vm.diseases.get(record.label)
    Card(onClick = onClick, modifier = modifier.fillMaxWidth()) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = File(record.imagePath),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(64.dp).clip(RoundedCornerShape(12.dp)),
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "${DiseaseRepository.cropEmoji(info.crop)} ${info.crop}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(info.name, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis,
                    color = if (record.healthy) Leaf else Danger)
                Text(
                    "${(record.confidence * 100).roundToInt()}% • " +
                        DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(record.timestamp)),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            trailing?.invoke()
        }
    }
}
