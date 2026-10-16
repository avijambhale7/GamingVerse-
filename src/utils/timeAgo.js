/* =========================================================
   TIME AGO
   "just now", "5m ago", "3h ago", "2d ago" — shared by the
   notification bell and the admin moderation lists.
========================================================= */
import { plural } from "./plural.js";

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

// Coarser label for reviews and comments: "Just now", "5h ago",
// "2 days ago" ("" when there's no time). One copy for the Games page,
// your Profile and other gamers' profiles.
export function reviewAge(timestamp, now = Date.now()) {
  const time = Number(timestamp);
  if (!time) return "";
  const hours = Math.max(0, Math.floor((now - time) / 3600000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${plural(Math.floor(hours / 24), "day")} ago`;
}
