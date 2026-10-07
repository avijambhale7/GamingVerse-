package com.cropguard.ai.data

import android.content.Context
import android.graphics.Bitmap
import com.cropguard.ai.util.ImageUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class ScanRecord(
    val id: String,
    val timestamp: Long,
    val label: String,
    val confidence: Float,
    val affectedRatio: Float,
    val healthy: Boolean,
    val imagePath: String,
)

/** Persists scan history as JSON plus a compressed JPEG per scan in internal storage. */
class HistoryRepository(context: Context) {
    private val imageDir = File(context.filesDir, "scans").apply { mkdirs() }
    private val indexFile = File(context.filesDir, "history.json")

    private val _records = MutableStateFlow(load())
    val records: StateFlow<List<ScanRecord>> = _records.asStateFlow()

    @Synchronized
    fun add(image: Bitmap, label: String, confidence: Float, affectedRatio: Float, healthy: Boolean): ScanRecord {
        val id = UUID.randomUUID().toString()
        val file = File(imageDir, "$id.jpg")
        ImageUtils.saveJpeg(ImageUtils.downscale(image, 720), file)
        val record = ScanRecord(id, System.currentTimeMillis(), label, confidence, affectedRatio, healthy, file.absolutePath)
        _records.value = listOf(record) + _records.value
        persist()
        return record
    }

    fun get(id: String): ScanRecord? = _records.value.firstOrNull { it.id == id }

    @Synchronized
    fun delete(id: String) {
        _records.value.firstOrNull { it.id == id }?.let { File(it.imagePath).delete() }
        _records.value = _records.value.filterNot { it.id == id }
        persist()
    }

    @Synchronized
    fun clear() {
        imageDir.listFiles()?.forEach { it.delete() }
        _records.value = emptyList()
        persist()
    }

    private fun persist() {
        val array = JSONArray()
        _records.value.forEach { r ->
            array.put(JSONObject().apply {
                put("id", r.id); put("timestamp", r.timestamp); put("label", r.label)
                put("confidence", r.confidence.toDouble()); put("affected", r.affectedRatio.toDouble())
                put("healthy", r.healthy); put("image", r.imagePath)
            })
        }
        val tmp = File(indexFile.parentFile, "history.json.tmp")
        tmp.writeText(array.toString())
        tmp.renameTo(indexFile)
    }

    private fun load(): List<ScanRecord> = runCatching {
        if (!indexFile.exists()) return emptyList()
        val array = JSONArray(indexFile.readText())
        List(array.length()) { i ->
            val o = array.getJSONObject(i)
            ScanRecord(
                id = o.getString("id"),
                timestamp = o.getLong("timestamp"),
                label = o.getString("label"),
                confidence = o.getDouble("confidence").toFloat(),
                affectedRatio = o.optDouble("affected", 0.0).toFloat(),
                healthy = o.optBoolean("healthy", false),
                imagePath = o.getString("image"),
            )
        }
    }.getOrDefault(emptyList())
}
