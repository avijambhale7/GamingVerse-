/* =========================================================
   MARKETPLACE HELPERS
========================================================= */

export function getOnlineSearchUrl(platform, productName) {
  const query = encodeURIComponent(productName);
  if (platform === "Amazon") {
    return `https://www.amazon.in/s?k=${query}`;
  }
  return `https://www.flipkart.com/search?q=${query}`;
}

export function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}
