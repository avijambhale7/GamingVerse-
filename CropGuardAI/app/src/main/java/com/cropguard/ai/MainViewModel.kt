package com.cropguard.ai

import android.app.Application
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.cropguard.ai.data.AppSettings
import com.cropguard.ai.data.DiseaseInfo
import com.cropguard.ai.data.ScanRecord
import com.cropguard.ai.ml.DiseaseClassifier
import com.cropguard.ai.ml.LeafAnalyzer
import com.cropguard.ai.ml.LeafReport
import com.cropguard.ai.ml.Prediction
import com.cropguard.ai.ml.Severity
import com.cropguard.ai.util.ImageUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class ResultStatus { CONFIDENT, UNCERTAIN, NO_LEAF, NO_MODEL }

data class AnalysisResult(
    val image: Bitmap,
    val leaf: LeafReport,
    val predictions: List<Pair<Prediction, DiseaseInfo>>,
    val status: ResultStatus,
    val timestamp: Long,
    val recordId: String?,
) {
    val top: Pair<Prediction, DiseaseInfo>? get() = predictions.firstOrNull()
    val isHealthy: Boolean get() = top?.second?.isHealthy == true && status == ResultStatus.CONFIDENT

    /** Severity shown to the user: combines the CNN diagnosis with measured lesion area. */
    val severity: Severity
        get() = when {
            isHealthy -> Severity.NONE
            top?.second?.isHealthy == false && leaf.severity == Severity.NONE -> Severity.LOW
            else -> leaf.severity
        }
}

sealed interface AnalysisState {
    data object Idle : AnalysisState
    data object Loading : AnalysisState
    data class Done(val result: AnalysisResult) : AnalysisState
    data class Error(val message: String) : AnalysisState
}

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val container = (app as CropGuardApp).container

    val settings: StateFlow<AppSettings> = container.settings.settings
    val history: StateFlow<List<ScanRecord>> = container.history.records
    val diseases = container.diseases

    private val _analysis = MutableStateFlow<AnalysisState>(AnalysisState.Idle)
    val analysis: StateFlow<AnalysisState> = _analysis.asStateFlow()

    private val _classifier = MutableStateFlow<DiseaseClassifier?>(null)
    val classifier: StateFlow<DiseaseClassifier?> = _classifier.asStateFlow()

    private val _modelChecked = MutableStateFlow(false)
    val modelChecked: StateFlow<Boolean> = _modelChecked.asStateFlow()

    init {
        // Warm up the model in the background so the first scan is fast.
        viewModelScope.launch(Dispatchers.Default) {
            _classifier.value = container.classifier
            _modelChecked.value = true
        }
    }

    fun updateSettings(transform: (AppSettings) -> AppSettings) = container.settings.update(transform)

    fun analyzeUri(uri: Uri) {
        _analysis.value = AnalysisState.Loading
        viewModelScope.launch {
            val bitmap = withContext(Dispatchers.IO) { ImageUtils.loadBitmap(getApplication(), uri) }
            if (bitmap == null) {
                _analysis.value = AnalysisState.Error(getApplication<Application>().getString(R.string.error_load_image))
            } else {
                runAnalysis(bitmap, save = true)
            }
        }
    }

    fun analyzeBitmap(bitmap: Bitmap) {
        _analysis.value = AnalysisState.Loading
        viewModelScope.launch { runAnalysis(bitmap, save = true) }
    }

    fun openRecord(record: ScanRecord) {
        _analysis.value = AnalysisState.Loading
        viewModelScope.launch {
            val bitmap = withContext(Dispatchers.IO) { BitmapFactory.decodeFile(record.imagePath) }
            if (bitmap == null) {
                _analysis.value = AnalysisState.Error(getApplication<Application>().getString(R.string.error_load_image))
            } else {
                runAnalysis(bitmap, save = false, recordId = record.id, timestamp = record.timestamp)
            }
        }
    }

    fun deleteRecord(id: String) = viewModelScope.launch(Dispatchers.IO) { container.history.delete(id) }

    fun clearHistory() = viewModelScope.launch(Dispatchers.IO) { container.history.clear() }

    private suspend fun runAnalysis(
        bitmap: Bitmap,
        save: Boolean,
        recordId: String? = null,
        timestamp: Long = System.currentTimeMillis(),
    ) {
        val result = withContext(Dispatchers.Default) {
            val image = ImageUtils.downscale(bitmap, 1024)
            val leaf = LeafAnalyzer.analyze(image)
            val classifier = container.classifier
            val predictions = classifier?.classify(image, topK = 3, testTimeAugmentation = true).orEmpty()
                .map { it to diseases.get(it.label) }
            val threshold = settings.value.threshold
            val topConfidence = predictions.firstOrNull()?.first?.confidence ?: 0f
            val status = when {
                classifier == null -> ResultStatus.NO_MODEL
                leaf.leafCoverage < 0.04f && topConfidence < 0.85f -> ResultStatus.NO_LEAF
                topConfidence < threshold -> ResultStatus.UNCERTAIN
                else -> ResultStatus.CONFIDENT
            }
            var id = recordId
            if (save && settings.value.autoSave && predictions.isNotEmpty() && status != ResultStatus.NO_LEAF) {
                val top = predictions.first()
                id = withContext(Dispatchers.IO) {
                    container.history.add(image, top.first.label, top.first.confidence, leaf.affectedRatio,
                        healthy = top.second.isHealthy).id
                }
            }
            AnalysisResult(image, leaf, predictions, status, timestamp, id)
        }
        _analysis.value = AnalysisState.Done(result)
    }
}
