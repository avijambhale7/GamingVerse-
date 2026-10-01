/* =========================================================
   IMAGE → DATA URL
   Shrinks a picked photo to a small JPEG data URL that can be
   saved straight into the Realtime Database. This project has
   no Firebase Storage bucket (Storage needs the paid Blaze
   plan), so every upload — profile photos, café photos,
   product images, feed posts — is stored this way.
========================================================= */

const DEFAULT_STEPS = [
  [1080, 0.82],
  [960, 0.72],
  [800, 0.65],
  [640, 0.6],
];

/* Returns a "data:image/jpeg;base64,..." string no longer than
   maxChars, stepping size/quality down until it fits. maxSide caps
   the longest edge (e.g. 400 for a profile photo). */
export async function compressImageToDataUrl(
  file,
  { maxSide = 1080, maxChars = 560000 } = {},
) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read this photo. Try a JPG or PNG image.");
  }

  const steps = DEFAULT_STEPS.map(([side, quality]) => [
    Math.min(side, maxSide),
    quality,
  ]);
  for (const [side, quality] of steps) {
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
