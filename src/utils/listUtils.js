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
