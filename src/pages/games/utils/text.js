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
