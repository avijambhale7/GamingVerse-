package com.cropguard.ai

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.History
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.cropguard.ai.ui.screens.DiseaseDetailScreen
import com.cropguard.ai.ui.screens.HistoryScreen
import com.cropguard.ai.ui.screens.HomeScreen
import com.cropguard.ai.ui.screens.InsightsScreen
import com.cropguard.ai.ui.screens.LibraryScreen
import com.cropguard.ai.ui.screens.LiveScanScreen
import com.cropguard.ai.ui.screens.OnboardingScreen
import com.cropguard.ai.ui.screens.ResultScreen
import com.cropguard.ai.ui.screens.SettingsScreen
import com.cropguard.ai.ui.theme.CropGuardTheme

class MainActivity : AppCompatActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            val settings by viewModel.settings.collectAsStateWithLifecycle()
            CropGuardTheme(settings.theme) {
                CropGuardNavHost(viewModel, startOnboarding = !settings.onboarded)
            }
        }
    }
}

private object Routes {
    const val ONBOARDING = "onboarding"
    const val HOME = "home"
    const val HISTORY = "history"
    const val LIBRARY = "library"
    const val INSIGHTS = "insights"
    const val SETTINGS = "settings"
    const val LIVE = "live"
    const val RESULT = "result"
    const val DISEASE = "disease"
}

private data class Tab(val route: String, val label: Int, val icon: ImageVector)

private val tabs = listOf(
    Tab(Routes.HOME, R.string.nav_home, Icons.Filled.Home),
    Tab(Routes.HISTORY, R.string.nav_history, Icons.Outlined.History),
    Tab(Routes.LIBRARY, R.string.nav_library, Icons.AutoMirrored.Filled.MenuBook),
    Tab(Routes.INSIGHTS, R.string.nav_insights, Icons.Filled.Insights),
    Tab(Routes.SETTINGS, R.string.nav_settings, Icons.Filled.Settings),
)

private fun NavHostController.openTab(route: String) = navigate(route) {
    popUpTo(graph.findStartDestination().id) { saveState = true }
    launchSingleTop = true
    restoreState = true
}

@Composable
private fun CropGuardNavHost(vm: MainViewModel, startOnboarding: Boolean) {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route
    val showBar = tabs.any { it.route == current }
    val start = remember { if (startOnboarding) Routes.ONBOARDING else Routes.HOME }

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            if (showBar) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = current == tab.route,
                            onClick = { nav.openTab(tab.route) },
                            icon = { Icon(tab.icon, null) },
                            label = { Text(stringResource(tab.label), maxLines = 1) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = start,
            modifier = Modifier.padding(padding).consumeWindowInsets(padding),
        ) {
            composable(Routes.ONBOARDING) {
                OnboardingScreen(onDone = {
                    vm.updateSettings { it.copy(onboarded = true) }
                    nav.navigate(Routes.HOME) { popUpTo(Routes.ONBOARDING) { inclusive = true } }
                })
            }
            composable(Routes.HOME) {
                HomeScreen(
                    vm = vm,
                    onLiveScan = { nav.navigate(Routes.LIVE) },
                    onAnalyzing = { nav.navigate(Routes.RESULT) },
                    onOpenRecord = { vm.openRecord(it); nav.navigate(Routes.RESULT) },
                    onSeeAllHistory = { nav.openTab(Routes.HISTORY) },
                    onOpenCrop = { nav.openTab(Routes.LIBRARY) },
                )
            }
            composable(Routes.HISTORY) {
                HistoryScreen(vm = vm, onOpenRecord = { vm.openRecord(it); nav.navigate(Routes.RESULT) })
            }
            composable(Routes.LIBRARY) {
                LibraryScreen(vm = vm, onOpenDisease = { nav.navigate("${Routes.DISEASE}/${android.net.Uri.encode(it)}") })
            }
            composable(Routes.INSIGHTS) { InsightsScreen(vm) }
            composable(Routes.SETTINGS) { SettingsScreen(vm) }
            composable(Routes.LIVE) {
                LiveScanScreen(
                    vm = vm,
                    onBack = { nav.popBackStack() },
                    onCaptured = { bitmap ->
                        vm.analyzeBitmap(bitmap)
                        nav.navigate(Routes.RESULT) { popUpTo(Routes.LIVE) { inclusive = true } }
                    },
                )
            }
            composable(Routes.RESULT) {
                ResultScreen(
                    vm = vm,
                    onBack = { nav.popBackStack() },
                    onOpenDisease = { nav.navigate("${Routes.DISEASE}/${android.net.Uri.encode(it)}") },
                )
            }
            composable(
                "${Routes.DISEASE}/{label}",
                arguments = listOf(navArgument("label") { type = NavType.StringType }),
            ) { entry ->
                val label = entry.arguments?.getString("label").orEmpty()
                DiseaseDetailScreen(vm = vm, label = label, onBack = { nav.popBackStack() })
            }
        }
    }
}
