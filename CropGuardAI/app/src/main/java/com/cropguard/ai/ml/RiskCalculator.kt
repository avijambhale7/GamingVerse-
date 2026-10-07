package com.cropguard.ai.ml

data class DiseaseRisk(val disease: String, val crops: String, val score: Float)

/**
 * Rule-based epidemiological model: each disease has a favourable temperature and
 * humidity band (from plant-pathology literature). Score 0..1 = how favourable
 * today's weather is for infection.
 */
object RiskCalculator {

    private class Rule(
        val disease: String, val crops: String,
        val tMin: Float, val tMax: Float, val tFall: Float,
        val hMin: Float, val hMax: Float, val hFall: Float,
        val wetFactor: Float, val dryFactor: Float,
    )

    private val rules = listOf(
        Rule("Late Blight", "Potato, Tomato", 10f, 24f, 6f, 90f, 100f, 20f, 1f, 0.55f),
        Rule("Early Blight", "Potato, Tomato", 24f, 29f, 7f, 80f, 100f, 30f, 1f, 0.7f),
        Rule("Powdery Mildew", "Squash, Cherry", 20f, 30f, 8f, 50f, 80f, 25f, 0.6f, 1f),
        Rule("Common Rust", "Corn", 16f, 25f, 6f, 95f, 100f, 25f, 1f, 0.5f),
        Rule("Bacterial Spot", "Tomato, Pepper, Peach", 24f, 30f, 6f, 85f, 100f, 25f, 1f, 0.4f),
        Rule("Apple Scab", "Apple", 17f, 24f, 7f, 90f, 100f, 25f, 1f, 0.4f),
        Rule("Black Rot", "Grape, Apple", 20f, 30f, 6f, 85f, 100f, 25f, 1f, 0.5f),
        Rule("Spider Mites", "Tomato", 27f, 35f, 6f, 20f, 50f, 20f, 0.5f, 1f),
    )

    private fun band(x: Float, lo: Float, hi: Float, fall: Float): Float = when {
        x < lo -> (1f - (lo - x) / fall).coerceAtLeast(0f)
        x > hi -> (1f - (x - hi) / fall).coerceAtLeast(0f)
        else -> 1f
    }

    fun calculate(temperature: Float, humidity: Float, wet: Boolean): List<DiseaseRisk> = rules
        .map { r ->
            val score = band(temperature, r.tMin, r.tMax, r.tFall) *
                band(humidity, r.hMin, r.hMax, r.hFall) *
                (if (wet) r.wetFactor else r.dryFactor)
            DiseaseRisk(r.disease, r.crops, score.coerceIn(0f, 1f))
        }
        .sortedByDescending { it.score }
}
