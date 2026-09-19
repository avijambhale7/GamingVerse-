/* =========================================================
   MARKETPLACE HELPERS
========================================================= */

export function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}
