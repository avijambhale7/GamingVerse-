/* =========================================================
   TEXT HELPERS
   Name normalisation and formatting shared across the games page.
========================================================= */
import { RAWG_BLOCKED_TERMS } from "../data/contentFilters.js";

export function normalizeGameSearchText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsBlockedGameTerm(value = "") {
  const text = normalizeGameSearchText(value);
  return RAWG_BLOCKED_TERMS.some((term) =>
    text.includes(normalizeGameSearchText(term)),
  );
}

export const normalizeCatalogueImageKey = (value = "") =>
  normalizeGameSearchText(value)
    .replace(/\bthe\b/g, " ")
    .replace(/\bmarvels\b/g, " ")
    .replace(/\btom clancys\b/g, " ")
    .replace(/\bea sports\b/g, " ")
    .replace(/\bremastered\b/g, " ")
    .replace(/\bthe end\b/g, " end ")
    .replace(/\s+/g, " ")
    .trim();

export const imageNameTokens = (value = "") =>
  new Set(
    normalizeCatalogueImageKey(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 1),
  );

export const localImageSimilarity = (a = "", b = "") => {
  const left = imageNameTokens(a);
  const right = imageNameTokens(b);
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });

  return intersection / Math.max(left.size, right.size);
};

export const normalizePriorityGameName = (value = "") =>
  String(value).toLowerCase().replace(/[:'’]/g, "").replace(/\s+/g, " ").trim();

export const normalizeTrailerGameName = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’':.!,-]/g, "")
    .replace(/\bthe last of us part 2\b/g, "the last of us part ii")
    .replace(/\bthe last of us part 1\b/g, "the last of us part i")
    .replace(/\bgrand theft auto 6\b/g, "gta vi")
    .replace(/\bgrand theft auto 5\b/g, "gta v")
    .replace(/\s+/g, " ")
    .trim();

export function normalizeLibraryGameName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/['’:!.,-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function createGameId(gameName) {
  return gameName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatActivityDate(timestamp) {
  const diff = Math.max(0, Date.now() - Number(timestamp || 0));
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/* ---------- chat date separators ---------- */

// Local calendar day of a timestamp, e.g. "2026-9-26" — used to spot
// where one day's messages end and the next begin.
export function chatDayKey(timestamp) {
  if (!Number(timestamp)) return "unknown";
  const d = new Date(Number(timestamp));
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// "Today", "Yesterday", "Monday" (this week) or "22 Sep 2026".
export function chatDayLabel(timestamp) {
  if (!Number(timestamp)) return "Earlier";
  const date = new Date(Number(timestamp));
  const today = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOf(today) - startOf(date)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7)
    return date.toLocaleDateString("en-IN", { weekday: "long" });
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Clock time for a chat bubble, e.g. "2:30 pm".
export function chatTime(timestamp) {
  if (!Number(timestamp)) return "";
  return new Date(Number(timestamp)).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
