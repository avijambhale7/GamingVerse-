package com.cropguard.ai.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cropguard.ai.R
import kotlinx.coroutines.launch

private data class Page(val icon: ImageVector, val title: Int, val body: Int)

private val pages = listOf(
    Page(Icons.Filled.CenterFocusStrong, R.string.onboarding_1_title, R.string.onboarding_1_body),
    Page(Icons.Filled.HealthAndSafety, R.string.onboarding_2_title, R.string.onboarding_2_body),
    Page(Icons.Filled.CloudOff, R.string.onboarding_3_title, R.string.onboarding_3_body),
)

@Composable
fun OnboardingScreen(onDone: () -> Unit) {
    val pager = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()
    val last = pager.currentPage == pages.lastIndex

    Column(Modifier.fillMaxSize().systemBarsPadding().padding(24.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            if (!last) TextButton(onClick = onDone) { Text(stringResource(R.string.skip)) }
        }
        HorizontalPager(state = pager, modifier = Modifier.weight(1f)) { index ->
            val page = pages[index]
            Column(
                Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.size(180.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(page.icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(96.dp))
                }
                Spacer(Modifier.height(40.dp))
                Text(stringResource(page.title), style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)
                Spacer(Modifier.height(14.dp))
                Text(
                    stringResource(page.body),
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Row(Modifier.fillMaxWidth().padding(vertical = 20.dp), horizontalArrangement = Arrangement.Center) {
            repeat(pages.size) { i ->
                val selected = pager.currentPage == i
                val width by animateDpAsState(if (selected) 24.dp else 8.dp, label = "dot")
                val color by animateColorAsState(
                    if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant, label = "dotColor",
                )
                Box(Modifier.padding(4.dp).height(8.dp).width(width).clip(RoundedCornerShape(50)).background(color))
            }
        }
        Button(
            onClick = { if (last) onDone() else scope.launch { pager.animateScrollToPage(pager.currentPage + 1) } },
            modifier = Modifier.fillMaxWidth().height(54.dp),
        ) {
            Text(stringResource(if (last) R.string.get_started else R.string.next))
        }
    }
}
