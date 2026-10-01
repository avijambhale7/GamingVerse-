import { compressImageToDataUrl } from "./imageData.js";

/* =========================================================
   UPLOAD IMAGE
   Used by ImageUploadButton (café, marketplace and admin
   forms). Returns the image as a compressed JPEG data URL,
   which the caller saves in the Realtime Database like any
   other image URL — this project has no Firebase Storage
   bucket, so uploads there never completed.
========================================================= */
export async function uploadImageFile(file) {
  return compressImageToDataUrl(file, { maxSide: 1080, maxChars: 400000 });
}
