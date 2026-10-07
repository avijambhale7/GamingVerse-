/* =========================================================
   PHOTO LIST (pure — unit tested in photoList.test.js)
   Café photos are shown as thumbnails (uploads are long data
   URLs, so they never go in a text box); new links are typed
   one per line and added on save.
========================================================= */

// Lines of pasted links → trimmed, non-empty entries.
export function photoLinesFrom(text = "") {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

// The photos to save: the current list, then any newly typed links,
// without duplicates or blanks, in order.
export function mergePhotoList(photos = [], linksText = "") {
  const seen = new Set();
  return [...(Array.isArray(photos) ? photos : []), ...photoLinesFrom(linksText)]
    .map((photo) => String(photo || "").trim())
    .filter((photo) => {
      if (!photo || seen.has(photo)) return false;
      seen.add(photo);
      return true;
    });
}
