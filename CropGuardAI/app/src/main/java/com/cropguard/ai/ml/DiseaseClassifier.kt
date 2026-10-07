package com.cropguard.ai.ml

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Log
import com.cropguard.ai.util.ImageUtils
import org.tensorflow.lite.DataType
import org.tensorflow.lite.Interpreter
import java.io.Closeable
import java.nio.ByteBuffer
import java.nio.ByteOrder

data class Prediction(val label: String, val confidence: Float)

/**
 * Runs the MobileNetV2 plant-disease TensorFlow Lite model.
 *
 * The model takes RGB pixels in 0..255 (float32 or uint8) and outputs softmax scores
 * whose order matches assets/labels.txt.
 */
class DiseaseClassifier private constructor(
    private val interpreter: Interpreter,
    val labels: List<String>,
) : Closeable {

    private val inputShape = interpreter.getInputTensor(0).shape()
    private val inputHeight = inputShape[1]
    private val inputWidth = inputShape[2]
    private val quantizedInput = interpreter.getInputTensor(0).dataType() == DataType.UINT8
    private val quantizedOutput = interpreter.getOutputTensor(0).dataType() == DataType.UINT8
    private val numClasses = interpreter.getOutputTensor(0).shape()[1]

    private val inputBuffer: ByteBuffer = ByteBuffer
        .allocateDirect(inputWidth * inputHeight * 3 * if (quantizedInput) 1 else 4)
        .order(ByteOrder.nativeOrder())
    private val pixels = IntArray(inputWidth * inputHeight)

    val classCount: Int get() = numClasses

    /**
     * Classifies a leaf image.
     * @param testTimeAugmentation also scores the mirrored image and averages (more robust, 2x slower).
     */
    @Synchronized
    fun classify(bitmap: Bitmap, topK: Int = 3, testTimeAugmentation: Boolean = false): List<Prediction> {
        val square = ImageUtils.centerCropSquare(bitmap)
        val scaled = Bitmap.createScaledBitmap(square, inputWidth, inputHeight, true)
        val scores = run(scaled)
        if (testTimeAugmentation) {
            val flipMatrix = Matrix().apply { preScale(-1f, 1f) }
            val flipped = Bitmap.createBitmap(scaled, 0, 0, scaled.width, scaled.height, flipMatrix, true)
            val flippedScores = run(flipped)
            for (i in scores.indices) scores[i] = (scores[i] + flippedScores[i]) / 2f
        }
        return scores.indices
            .sortedByDescending { scores[it] }
            .take(topK)
            .map { Prediction(labels.getOrElse(it) { "Class $it" }, scores[it]) }
    }

    private fun run(bitmap: Bitmap): FloatArray {
        val argb = if (bitmap.config == Bitmap.Config.ARGB_8888) bitmap else bitmap.copy(Bitmap.Config.ARGB_8888, false)
        argb.getPixels(pixels, 0, inputWidth, 0, 0, inputWidth, inputHeight)
        inputBuffer.rewind()
        for (p in pixels) {
            val r = (p shr 16) and 0xFF
            val g = (p shr 8) and 0xFF
            val b = p and 0xFF
            if (quantizedInput) {
                inputBuffer.put(r.toByte()); inputBuffer.put(g.toByte()); inputBuffer.put(b.toByte())
            } else {
                inputBuffer.putFloat(r.toFloat()); inputBuffer.putFloat(g.toFloat()); inputBuffer.putFloat(b.toFloat())
            }
        }
        inputBuffer.rewind()
        return if (quantizedOutput) {
            val out = Array(1) { ByteArray(numClasses) }
            interpreter.run(inputBuffer, out)
            FloatArray(numClasses) { (out[0][it].toInt() and 0xFF) / 255f }
        } else {
            val out = Array(1) { FloatArray(numClasses) }
            interpreter.run(inputBuffer, out)
            out[0]
        }
    }

    override fun close() = interpreter.close()

    companion object {
        private const val TAG = "DiseaseClassifier"
        const val MODEL_FILE = "plant_disease_model.tflite"
        const val LABELS_FILE = "labels.txt"

        fun create(context: Context): DiseaseClassifier? = try {
            val bytes = context.assets.open(MODEL_FILE).use { it.readBytes() }
            val model = ByteBuffer.allocateDirect(bytes.size).order(ByteOrder.nativeOrder())
            model.put(bytes)
            model.rewind()
            val labels = context.assets.open(LABELS_FILE).bufferedReader().useLines { lines ->
                lines.map { it.trim() }.filter { it.isNotEmpty() }.toList()
            }
            val options = Interpreter.Options().apply {
                setNumThreads(Runtime.getRuntime().availableProcessors().coerceIn(1, 4))
            }
            DiseaseClassifier(Interpreter(model, options), labels)
        } catch (e: Exception) {
            Log.w(TAG, "Model not available: ${e.message}")
            null
        }
    }
}
