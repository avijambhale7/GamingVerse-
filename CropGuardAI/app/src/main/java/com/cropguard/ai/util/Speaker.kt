package com.cropguard.ai.util

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.Locale

/** Thin wrapper around Android TextToSpeech for reading diagnoses aloud. */
class Speaker(context: Context) : TextToSpeech.OnInitListener {
    private val tts = TextToSpeech(context.applicationContext, this)
    private var ready = false
    private var pending: String? = null

    private val _speaking = MutableStateFlow(false)
    val speaking: StateFlow<Boolean> = _speaking

    override fun onInit(status: Int) {
        if (status != TextToSpeech.SUCCESS) return
        val locale = Locale.getDefault()
        if (tts.isLanguageAvailable(locale) >= TextToSpeech.LANG_AVAILABLE) tts.language = locale else tts.language = Locale.US
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) { _speaking.value = true }
            override fun onDone(utteranceId: String?) { _speaking.value = false }
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) { _speaking.value = false }
        })
        ready = true
        pending?.let { speak(it) }
        pending = null
    }

    fun speak(text: String) {
        if (!ready) { pending = text; return }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "cropguard")
    }

    fun stop() {
        tts.stop()
        _speaking.value = false
    }

    fun shutdown() {
        tts.stop()
        tts.shutdown()
    }
}
