package com.cropguard.ai.util

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.core.content.FileProvider
import com.cropguard.ai.data.DiseaseInfo
import java.io.File
import java.text.DateFormat
import java.util.Date
import kotlin.math.roundToInt

/** Builds a shareable PDF / text report for a diagnosis. */
object ReportExporter {

    data class Report(
        val image: Bitmap,
        val heatmap: Bitmap?,
        val info: DiseaseInfo,
        val confidence: Float,
        val affectedRatio: Float,
        val severity: String,
        val timestamp: Long,
    )

    fun summaryText(r: Report): String = buildString {
        appendLine("CropGuard AI — Diagnosis report")
        appendLine(DateFormat.getDateTimeInstance().format(Date(r.timestamp)))
        appendLine()
        appendLine("Crop: ${r.info.crop}")
        appendLine("Diagnosis: ${r.info.name} (${r.info.type})")
        appendLine("Confidence: ${(r.confidence * 100).roundToInt()}%")
        if (!r.info.isHealthy) {
            appendLine("Affected leaf area: ${(r.affectedRatio * 100).roundToInt()}% — ${r.severity}")
            appendLine("Pathogen: ${r.info.pathogen}")
        }
        fun section(title: String, items: List<String>) {
            if (items.isEmpty()) return
            appendLine(); appendLine("$title:")
            items.forEach { appendLine(" • $it") }
        }
        section("Symptoms", r.info.symptoms)
        section("Organic treatment", r.info.organic)
        section("Chemical treatment", r.info.chemical)
        section("Prevention", r.info.prevention)
        appendLine()
        append("AI predictions are guidance only — consult a local agriculture expert.")
    }

    fun shareText(context: Context, r: Report) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "CropGuard AI: ${r.info.displayName}")
            putExtra(Intent.EXTRA_TEXT, summaryText(r))
        }
        context.startActivity(Intent.createChooser(intent, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    fun exportPdf(context: Context, r: Report): File {
        val pageW = 595; val pageH = 842; val margin = 40f
        val doc = PdfDocument()
        var pageNo = 1
        var page = doc.startPage(PdfDocument.PageInfo.Builder(pageW, pageH, pageNo).create())
        var canvas: Canvas = page.canvas
        var y = margin

        val brand = Color.rgb(27, 94, 32)
        val title = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 22f; color = brand; typeface = Typeface.DEFAULT_BOLD }
        val heading = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 14f; color = brand; typeface = Typeface.DEFAULT_BOLD }
        val body = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 11f; color = Color.DKGRAY }
        val width = (pageW - margin * 2).toInt()

        fun newPageIfNeeded(needed: Float) {
            if (y + needed <= pageH - margin) return
            doc.finishPage(page)
            pageNo++
            page = doc.startPage(PdfDocument.PageInfo.Builder(pageW, pageH, pageNo).create())
            canvas = page.canvas
            y = margin
        }

        fun text(t: String, paint: TextPaint, spacingAfter: Float = 6f) {
            @Suppress("DEPRECATION")
            val layout = StaticLayout(t, paint, width, Layout.Alignment.ALIGN_NORMAL, 1.15f, 0f, false)
            newPageIfNeeded(layout.height.toFloat())
            canvas.save(); canvas.translate(margin, y); layout.draw(canvas); canvas.restore()
            y += layout.height + spacingAfter
        }

        canvas.drawRect(0f, 0f, pageW.toFloat(), 8f, Paint().apply { color = brand })
        text("CropGuard AI — Diagnosis report", title, 2f)
        text(DateFormat.getDateTimeInstance().format(Date(r.timestamp)), body, 14f)

        val imgSize = 200f
        canvas.drawBitmap(r.image, null, RectF(margin, y, margin + imgSize, y + imgSize), null)
        r.heatmap?.let { canvas.drawBitmap(it, null, RectF(margin + imgSize + 20f, y, margin + imgSize * 2 + 20f, y + imgSize), null) }
        y += imgSize + 16f

        text("${r.info.crop}: ${r.info.name}", heading.apply { textSize = 18f }, 4f)
        heading.textSize = 14f
        text("Type: ${r.info.type}   •   Confidence: ${(r.confidence * 100).roundToInt()}%", body)
        if (!r.info.isHealthy) {
            text("Affected leaf area: ${(r.affectedRatio * 100).roundToInt()}% (${r.severity})", body)
            text("Pathogen: ${r.info.pathogen}", body, 12f)
        }
        fun section(name: String, items: List<String>) {
            if (items.isEmpty()) return
            text(name, heading, 4f)
            items.forEach { text("•  $it", body, 2f) }
            y += 8f
        }
        section("Symptoms", r.info.symptoms)
        section("Causes", r.info.causes)
        section("Organic treatment", r.info.organic)
        section("Chemical treatment", r.info.chemical)
        section("Prevention", r.info.prevention)
        text("Disclaimer: AI predictions are guidance only. Consult a local agriculture expert before applying chemicals.",
            TextPaint(body).apply { textSize = 9f; color = Color.GRAY })
        doc.finishPage(page)

        val dir = File(context.cacheDir, "reports").apply { mkdirs() }
        val file = File(dir, "CropGuard_${r.info.crop.replace(' ', '_')}_${r.timestamp}.pdf")
        file.outputStream().use { doc.writeTo(it) }
        doc.close()
        return file
    }

    fun sharePdf(context: Context, file: File) {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}
