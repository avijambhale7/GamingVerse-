package com.cropguard.ai.data

import android.content.Context
import org.json.JSONArray

data class DiseaseInfo(
    val label: String,
    val crop: String,
    val name: String,
    val type: String,
    val pathogen: String,
    val symptoms: List<String>,
    val causes: List<String>,
    val organic: List<String>,
    val chemical: List<String>,
    val prevention: List<String>,
) {
    val isHealthy: Boolean get() = type.equals("Healthy", ignoreCase = true)
    val displayName: String get() = if (isHealthy) "$crop — Healthy" else "$crop $name"
}

/** Offline disease knowledge base loaded from assets/diseases.json. */
class DiseaseRepository(context: Context) {

    val all: List<DiseaseInfo> = runCatching {
        val json = context.assets.open("diseases.json").bufferedReader().use { it.readText() }
        val array = JSONArray(json)
        List(array.length()) { i ->
            val o = array.getJSONObject(i)
            fun list(key: String): List<String> {
                val a = o.optJSONArray(key) ?: return emptyList()
                return List(a.length()) { a.getString(it) }
            }
            DiseaseInfo(
                label = o.getString("label"),
                crop = o.getString("crop"),
                name = o.getString("name"),
                type = o.optString("type", "Unknown"),
                pathogen = o.optString("pathogen", "-"),
                symptoms = list("symptoms"),
                causes = list("causes"),
                organic = list("organic"),
                chemical = list("chemical"),
                prevention = list("prevention"),
            )
        }
    }.getOrDefault(emptyList())

    private val byLabel = all.associateBy { it.label }

    val crops: List<String> = all.map { it.crop }.distinct().sorted()

    /** Returns knowledge for a model label, synthesising a minimal entry for unknown labels. */
    fun get(label: String): DiseaseInfo = byLabel[label] ?: run {
        val crop = label.substringBefore("___").replace('_', ' ').trim()
        val disease = label.substringAfter("___", label).replace('_', ' ').trim()
        val healthy = disease.equals("healthy", ignoreCase = true)
        DiseaseInfo(label, crop, if (healthy) "Healthy" else disease, if (healthy) "Healthy" else "Unknown",
            "-", emptyList(), emptyList(), emptyList(), emptyList(), emptyList())
    }

    companion object {
        private val emoji = mapOf(
            "Apple" to "🍎", "Blueberry" to "🫐", "Cherry" to "🍒", "Corn" to "🌽", "Grape" to "🍇",
            "Orange" to "🍊", "Peach" to "🍑", "Bell Pepper" to "🫑", "Potato" to "🥔",
            "Raspberry" to "🍓", "Soybean" to "🫘", "Squash" to "🎃", "Strawberry" to "🍓", "Tomato" to "🍅",
        )

        fun cropEmoji(crop: String): String = emoji[crop] ?: "🌱"
    }
}
