package com.cropguard.ai.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.File
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object ImageUtils {

    /** Decodes a content Uri, downsampled to roughly [maxDim] and rotated upright using EXIF. */
    fun loadBitmap(context: Context, uri: Uri, maxDim: Int = 1280): Bitmap? = runCatching {
        val resolver = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxDim) sample *= 2
        val opts = BitmapFactory.Options().apply {
            inSampleSize = sample
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        val bitmap = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) }
            ?: return null
        val rotation = resolver.openInputStream(uri)?.use {
            when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        } ?: 0
        downscale(rotate(bitmap, rotation), maxDim)
    }.getOrNull()

    fun rotate(bitmap: Bitmap, degrees: Int): Bitmap {
        if (degrees % 360 == 0) return bitmap
        val m = Matrix().apply { postRotate(degrees.toFloat()) }
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, m, true)
    }

    fun downscale(bitmap: Bitmap, maxDim: Int): Bitmap {
        val largest = max(bitmap.width, bitmap.height)
        if (largest <= maxDim) return bitmap
        val s = maxDim.toFloat() / largest
        return Bitmap.createScaledBitmap(bitmap, (bitmap.width * s).roundToInt(), (bitmap.height * s).roundToInt(), true)
    }

    fun centerCropSquare(bitmap: Bitmap): Bitmap {
        val size = min(bitmap.width, bitmap.height)
        if (bitmap.width == bitmap.height) return bitmap
        return Bitmap.createBitmap(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size)
    }

    fun saveJpeg(bitmap: Bitmap, file: File, quality: Int = 88) {
        file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, quality, it) }
    }
}
