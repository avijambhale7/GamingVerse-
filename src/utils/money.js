/* =========================================================
   MONEY
   Indian-rupee amounts as shown everywhere: "₹1,499".
========================================================= */
export function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}
