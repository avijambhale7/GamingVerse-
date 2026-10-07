package com.cropguard.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cropguard.ai.R
import com.cropguard.ai.ml.Severity
import com.cropguard.ai.ui.theme.Danger
import com.cropguard.ai.ui.theme.Harvest
import com.cropguard.ai.ui.theme.Leaf
import com.cropguard.ai.ui.theme.Warning
import com.cropguard.ai.ui.theme.typeColor

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    Row(
        modifier = modifier.fillMaxWidth().padding(top = 8.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
        action?.invoke()
    }
}

@Composable
fun StatCard(label: String, value: String, icon: ImageVector, tint: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
    ) {
        Column(Modifier.padding(14.dp)) {
            Box(
                Modifier.size(34.dp).clip(CircleShape).background(tint.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp)) }
            Spacer(Modifier.height(10.dp))
            Text(value, style = MaterialTheme.typography.headlineSmall)
            Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun TypeBadge(type: String) {
    val c = typeColor(type)
    Text(
        type,
        color = c,
        style = MaterialTheme.typography.labelMedium,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(c.copy(alpha = 0.14f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    )
}

fun severityColor(s: Severity): Color = when (s) {
    Severity.NONE -> Leaf
    Severity.LOW -> Harvest
    Severity.MODERATE -> Warning
    Severity.SEVERE -> Danger
}

@Composable
fun severityLabel(s: Severity): String = stringResource(
    when (s) {
        Severity.NONE -> R.string.severity_none
        Severity.LOW -> R.string.severity_low
        Severity.MODERATE -> R.string.severity_moderate
        Severity.SEVERE -> R.string.severity_severe
    }
)

@Composable
fun ConfidenceBar(value: Float, color: Color, modifier: Modifier = Modifier) {
    LinearProgressIndicator(
        progress = { value.coerceIn(0f, 1f) },
        modifier = modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(50)),
        color = color,
        trackColor = color.copy(alpha = 0.15f),
        drawStopIndicator = {},
    )
}

@Composable
fun InfoSection(title: String, icon: ImageVector, items: List<String>, tint: Color) {
    if (items.isEmpty()) return
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(32.dp).clip(CircleShape).background(tint.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center,
                ) { Icon(icon, null, tint = tint, modifier = Modifier.size(18.dp)) }
                Spacer(Modifier.width(10.dp))
                Text(title, style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.height(10.dp))
            items.forEach { item ->
                Row(Modifier.padding(vertical = 3.dp)) {
                    Box(
                        Modifier.padding(top = 7.dp).size(6.dp).clip(CircleShape).background(tint)
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(item, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
fun EmptyState(icon: ImageVector, text: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f), modifier = Modifier.size(64.dp))
        Spacer(Modifier.height(12.dp))
        Text(
            text,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun Banner(text: String, color: Color, icon: ImageVector = Icons.Filled.Info) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(color.copy(alpha = 0.13f))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = color)
        Spacer(Modifier.width(12.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}
