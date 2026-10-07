/* =========================================================
   LIST HELPERS (pure — unit tested in listUtils.test.js)
========================================================= */

// Puts `item` at the front of `list`, removing any entry with the same
// id first. Used right after saving something that a realtime listener
// may already have added, so it shows at once without a duplicate (and
// without React's "two children with the same key" warning).
export function upsertById(list, item) {
  if (!item) return Array.isArray(list) ? list : [];
  const rest = (Array.isArray(list) ? list : []).filter(
    (entry) => entry?.id !== item.id,
  );
  return [item, ...rest];
}

// "1 result", "26 results", or "20+ results" while more pages exist
// (the database can't count everything without downloading it all).
export function resultCountLabel(count, hasMore = false) {
  const n = Math.max(0, Number(count) || 0);
  if (hasMore) return `${n}+ results`;
  return `${n} result${n === 1 ? "" : "s"}`;
}
