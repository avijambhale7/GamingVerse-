package com.cropguard.ai.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cropguard.ai.MainViewModel
import com.cropguard.ai.R
import com.cropguard.ai.ml.Prediction
import com.cropguard.ai.ui.theme.Danger
import com.cropguard.ai.ui.theme.Harvest
import com.cropguard.ai.ui.theme.Leaf
import com.cropguard.ai.util.ImageUtils
import java.util.concurrent.Executors
import kotlin.math.roundToInt

@Composable
fun LiveScanScreen(vm: MainViewModel, onBack: () -> Unit, onCaptured: (Bitmap) -> Unit) {
    val context = LocalContext.current
    var granted by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted = it }
    LaunchedEffect(Unit) { if (!granted) launcher.launch(Manifest.permission.CAMERA) }

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        if (granted) {
            CameraContent(vm, onCaptured)
        } else {
            Column(
                Modifier.align(Alignment.Center).padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(Icons.Filled.NoPhotography, null, tint = Color.White, modifier = Modifier.size(64.dp))
                Spacer(Modifier.height(16.dp))
                Text(stringResource(R.string.camera_permission_needed), color = Color.White)
                Spacer(Modifier.height(16.dp))
                Button(onClick = { launcher.launch(Manifest.permission.CAMERA) }) {
                    Text(stringResource(R.string.grant_permission))
                }
            }
        }
        IconButton(
            onClick = onBack,
            modifier = Modifier.statusBarsPadding().padding(8.dp).clip(CircleShape).background(Color.Black.copy(alpha = 0.4f)),
        ) { Icon(Icons.AutoMirrored.Filled.ArrowBack, stringResource(R.string.back), tint = Color.White) }
    }
}

@Composable
private fun BoxScope.CameraContent(vm: MainViewModel, onCaptured: (Bitmap) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val classifier by vm.classifier.collectAsStateWithLifecycle()
    val executor = remember { Executors.newSingleThreadExecutor() }
    val previewView = remember { PreviewView(context).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }

    var prediction by remember { mutableStateOf<Prediction?>(null) }
    var latestFrame by remember { mutableStateOf<Bitmap?>(null) }
    var camera by remember { mutableStateOf<Camera?>(null) }
    var torchOn by remember { mutableStateOf(false) }

    DisposableEffect(lifecycleOwner, classifier) {
        val providerFuture = ProcessCameraProvider.getInstance(context)
        var lastRun = 0L
        providerFuture.addListener({
            val provider = providerFuture.get()
            val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
            val analysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                .build()
            analysis.setAnalyzer(executor) { proxy ->
                try {
                    val now = System.currentTimeMillis()
                    if (now - lastRun >= 350) {
                        lastRun = now
                        val frame = ImageUtils.rotate(proxy.toBitmap(), proxy.imageInfo.rotationDegrees)
                        latestFrame = frame
                        prediction = classifier?.classify(frame, topK = 1)?.firstOrNull()
                    }
                } catch (_: Exception) {
                } finally {
                    proxy.close()
                }
            }
            runCatching {
                provider.unbindAll()
                camera = provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            runCatching { providerFuture.get().unbindAll() }
        }
    }
    DisposableEffect(Unit) { onDispose { executor.shutdown() } }

    AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())

    // Animated scanning frame
    val transition = rememberInfiniteTransition(label = "scan")
    val sweep by transition.animateFloat(
        0f, 1f, infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Reverse), label = "sweep",
    )
    val p = prediction
    val info = p?.let { vm.diseases.get(it.label) }
    val confident = p != null && p.confidence >= 0.6f
    val frameColor = when {
        !confident || info == null -> Color.White
        info.isHealthy -> Leaf
        else -> Danger
    }
    Canvas(Modifier.align(Alignment.Center).fillMaxWidth(0.78f).aspectRatio(1f)) {
        val c = size.width * 0.16f
        val w = 5.dp.toPx()
        val corners = listOf(
            Offset(0f, 0f) to Pair(Offset(c, 0f), Offset(0f, c)),
            Offset(size.width, 0f) to Pair(Offset(size.width - c, 0f), Offset(size.width, c)),
            Offset(0f, size.height) to Pair(Offset(c, size.height), Offset(0f, size.height - c)),
            Offset(size.width, size.height) to Pair(Offset(size.width - c, size.height), Offset(size.width, size.height - c)),
        )
        corners.forEach { (corner, ends) ->
            drawLine(frameColor, corner, ends.first, w, StrokeCap.Round)
            drawLine(frameColor, corner, ends.second, w, StrokeCap.Round)
        }
        val y = size.height * sweep
        drawLine(frameColor.copy(alpha = 0.7f), Offset(8f, y), Offset(size.width - 8f, y), 3.dp.toPx(), StrokeCap.Round)
    }

    // Live prediction + controls
    Column(
        Modifier.align(Alignment.BottomCenter).fillMaxWidth().navigationBarsPadding().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.6f)),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(14.dp)) {
                if (classifier == null) {
                    Text(stringResource(R.string.model_missing), color = Harvest)
                } else if (p == null || info == null || !confident) {
                    Text(stringResource(R.string.live_hint), color = Color.White, style = MaterialTheme.typography.titleMedium)
                    Text(stringResource(R.string.live_detecting), color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodySmall)
                } else {
                    Text(info.crop, color = Color.White.copy(alpha = 0.75f), style = MaterialTheme.typography.labelLarge)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(info.name, color = frameColor, style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text("${(p.confidence * 100).roundToInt()}%", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { p.confidence },
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(50)),
                        color = frameColor,
                        trackColor = Color.White.copy(alpha = 0.2f),
                        drawStopIndicator = {},
                    )
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            FilledIconButton(
                onClick = {
                    torchOn = !torchOn
                    camera?.cameraControl?.enableTorch(torchOn)
                },
                colors = IconButtonDefaults.filledIconButtonColors(containerColor = Color.White.copy(alpha = 0.2f)),
                modifier = Modifier.size(52.dp),
            ) {
                Icon(if (torchOn) Icons.Filled.FlashOn else Icons.Filled.FlashOff, stringResource(R.string.torch), tint = Color.White)
            }
            Spacer(Modifier.width(20.dp))
            ExtendedFloatingActionButton(
                onClick = { latestFrame?.let(onCaptured) },
                icon = { Icon(Icons.Filled.Camera, null) },
                text = { Text(stringResource(R.string.live_capture)) },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
            )
        }
    }
}
