package com.cropguard.ai

import android.app.Application
import android.content.Context
import com.cropguard.ai.data.DiseaseRepository
import com.cropguard.ai.data.HistoryRepository
import com.cropguard.ai.data.SettingsRepository
import com.cropguard.ai.ml.DiseaseClassifier

class CropGuardApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

/** Simple manual dependency container shared across the app. */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext
    val settings = SettingsRepository(appContext)
    val diseases = DiseaseRepository(appContext)
    val history = HistoryRepository(appContext)

    /** Loaded lazily (and off the main thread by callers) - null if the model asset is missing. */
    val classifier: DiseaseClassifier? by lazy { DiseaseClassifier.create(appContext) }
}
