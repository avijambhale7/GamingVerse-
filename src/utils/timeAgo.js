/* =========================================================
   TIME AGO
   "just now", "5m ago", "3h ago", "2d ago" — shared by the
   notification bell and the admin moderation lists.
========================================================= */
export default function timeAgo(timestamp) {
  const diff = Date.now() - Number(timestamp || 0);
  if (!timestamp || diff < 0) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
