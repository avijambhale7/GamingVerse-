/* =========================================================
   IMAGE → DATA URL
   Shrinks a picked photo to a small JPEG data URL that can be
   saved straight into the Realtime Database. This project has
   no Firebase Storage bucket (Storage needs the paid Blaze
   plan), so every upload — profile photos, café photos,
   product images, feed posts — is stored this way.
========================================================= */

const KB = 1024;

/* Size limits for new uploads (existing photos are left as they are).
   maxChars is the stored data-URL length, i.e. roughly its size in
   the database — kept small so pages load fast on slow phones. */
export const IMAGE_PRESETS = {
  feed: { maxSide: 1080, maxChars: 200 * KB },
  product: { maxSide: 1080, maxChars: 200 * KB },
  cafe: { maxSide: 1280, maxChars: 300 * KB },
  avatar: { maxSide: 256, maxChars: 40 * KB },
  poster: { maxSide: 1080, maxChars: 250 * KB },
};

const QUALITIES = [0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.42];
const SHRINK = [1, 0.85, 0.7, 0.55];

/* The [longest side, JPEG quality] attempts, in order: lower the
   quality step by step at full size first, and only then make the
   picture smaller. Pure — unit tested. */
export function compressionSteps(maxSide = 1080) {
  const steps = [];
  for (const factor of SHRINK) {
    const side = Math.max(160, Math.round(maxSide * factor));
    for (const quality of QUALITIES) steps.push([side, quality]);
  }
  return steps;
}

/* Returns a "data:image/jpeg;base64,..." string no longer than
   maxChars, trying compressionSteps() until one fits. maxSide caps
   the longest edge. Pass a preset name ("feed", "avatar"…) or
   explicit { maxSide, maxChars }. */
export async function compressImageToDataUrl(file, options = {}) {
  const { maxSide = 1080, maxChars = 200 * KB } =
    typeof options === "string" ? IMAGE_PRESETS[options] || {} : options;
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read this photo. Try a JPG or PNG image.");
  }

  for (const [side, quality] of compressionSteps(maxSide)) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    // JPEG has no transparency: paint transparent PNGs on dark, not black.
    context.fillStyle = "#111117";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= maxChars) return dataUrl;
  }
  throw new Error("This photo is too large. Try a smaller image.");
}

export const isDataUrl = (value) => String(value || "").startsWith("data:");
