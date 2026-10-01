/* =========================================================
   CAFÉ REVIEW HELPERS (used by views/CafeReviews.jsx, Cafe.jsx)
========================================================= */

export const stars = (n) =>
  "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

/* { [cafeId]: { avg, count, list, byUser } } from the whole node. */
export function summariseReviews(all) {
  const out = {};
  Object.entries(all || {}).forEach(([cafeId, byUser]) => {
    const list = Object.entries(byUser || {})
      .map(([uid, review]) => ({ uid, ...review }))
      .filter((review) => Number(review.rating) >= 1)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    if (!list.length) return;
    const avg =
      list.reduce((sum, r) => sum + Number(r.rating), 0) / list.length;
    out[cafeId] = {
      avg,
      count: list.length,
      list,
      byUser: Object.fromEntries(list.map((r) => [r.uid, r])),
    };
  });
  return out;
}
