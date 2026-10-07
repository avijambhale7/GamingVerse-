package com.cropguard.ai.ml

import android.graphics.Bitmap
import android.graphics.Color
import kotlin.math.max
import kotlin.math.roundToInt

enum class Severity { NONE, LOW, MODERATE, SEVERE }

data class LeafReport(
    /** Fraction of the image covered by leaf tissue (green + lesions). */
    val leafCoverage: Float,
    /** Fraction of leaf tissue that is discoloured (yellow / brown / necrotic). */
    val affectedRatio: Float,
    val healthScore: Int,
    val severity: Severity,
    /** Image with lesions highlighted in red and background dimmed. */
    val heatmap: Bitmap,
)

/**
 * Classical computer-vision leaf analysis that complements the neural network:
 * segments healthy green tissue vs. discoloured lesions in HSV space to estimate
 * how much of the leaf is affected and produces a visual "disease heatmap".
 */
object LeafAnalyzer {
    private const val MAX_DIM = 360
    private const val WINDOW = 9 // half-size of the neighbourhood used to find leaf regions

    // Thresholds were calibrated on PlantVillage images: healthy leaves score ~0.1 % affected,
    // diseased leaves 1.5-12 %.

    fun analyze(source: Bitmap): LeafReport {
        val scale = MAX_DIM.toFloat() / max(source.width, source.height)
        val bmp = if (scale < 1f) {
            Bitmap.createScaledBitmap(source, (source.width * scale).roundToInt(), (source.height * scale).roundToInt(), true)
        } else source
        val w = bmp.width
        val h = bmp.height
        val pixels = IntArray(w * h)
        bmp.getPixels(pixels, 0, w, 0, 0, w, h)

        val hsv = FloatArray(3)
        val green = BooleanArray(w * h)
        val lesionCandidate = BooleanArray(w * h)
        for (i in pixels.indices) {
            Color.colorToHSV(pixels[i], hsv)
            val hue = hsv[0]; val sat = hsv[1]; val v = hsv[2]
            if (hue in 65f..170f && sat > 0.15f && v > 0.12f) {
                green[i] = true
            } else if (sat > 0.3f && v > 0.2f && (hue < 60f || hue > 330f)) {
                lesionCandidate[i] = true // yellow, orange, brown, reddish tissue
            }
        }

        // Integral image of green pixels: a lesion only counts if it sits near leaf tissue,
        // which filters out brown soil, wooden tables, etc.
        val integral = IntArray((w + 1) * (h + 1))
        for (y in 0 until h) {
            var rowSum = 0
            for (x in 0 until w) {
                if (green[y * w + x]) rowSum++
                integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum
            }
        }
        fun greenAround(x: Int, y: Int): Float {
            val x0 = (x - WINDOW).coerceAtLeast(0); val y0 = (y - WINDOW).coerceAtLeast(0)
            val x1 = (x + WINDOW + 1).coerceAtMost(w); val y1 = (y + WINDOW + 1).coerceAtMost(h)
            val sum = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] -
                integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0]
            return sum.toFloat() / ((x1 - x0) * (y1 - y0))
        }

        var greenCount = 0
        var lesionCount = 0
        val heat = IntArray(w * h)
        for (y in 0 until h) {
            for (x in 0 until w) {
                val i = y * w + x
                val p = pixels[i]
                val r = Color.red(p); val g = Color.green(p); val b = Color.blue(p)
                when {
                    green[i] -> {
                        greenCount++
                        heat[i] = Color.rgb((r * 0.6f).toInt(), (g * 0.9f + 20).toInt().coerceAtMost(255), (b * 0.6f).toInt())
                    }
                    lesionCandidate[i] && greenAround(x, y) > 0.08f -> {
                        lesionCount++
                        heat[i] = Color.rgb(255, (g * 0.25f).toInt(), (b * 0.15f).toInt())
                    }
                    else -> {
                        val grey = ((r + g + b) / 3 * 0.35f).toInt()
                        heat[i] = Color.rgb(grey, grey, grey)
                    }
                }
            }
        }
        val heatmap = Bitmap.createBitmap(heat, w, h, Bitmap.Config.ARGB_8888)

        val leaf = greenCount + lesionCount
        val affected = if (leaf == 0) 0f else lesionCount.toFloat() / leaf
        val severity = when {
            affected < 0.01f -> Severity.NONE
            affected < 0.05f -> Severity.LOW
            affected < 0.15f -> Severity.MODERATE
            else -> Severity.SEVERE
        }
        return LeafReport(
            leafCoverage = leaf.toFloat() / (w * h),
            affectedRatio = affected,
            // Lesions >= 25 % of the leaf mean a score of 0.
            healthScore = (100f - affected * 400f).coerceIn(0f, 100f).roundToInt(),
            severity = severity,
            heatmap = heatmap,
        )
    }
}
