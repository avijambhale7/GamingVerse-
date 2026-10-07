/* =========================================================
   AUTHOR LABELS & WORDING (pure — unit tested in authorLabel.test.js)
========================================================= */

const HANDLE = /^[a-z0-9_.]{3,20}$/;

// How a review / comment author is shown: "@username" when the entry
// stored the account's username (userHandle), otherwise the display name
// as-is — older entries only have a display name, which isn't a handle,
// so it gets no "@".
export function authorLabel(entry = {}) {
  const handle = String(entry?.userHandle || "").trim().toLowerCase();
  if (HANDLE.test(handle)) return `@${handle}`;
  return String(entry?.userName || "").trim() || "Gamer";
}

const VERDICT_NAMES = {
  skip: "Skip",
  timepass: "Timepass",
  "go-for-it": "Go for it",
  perfection: "Perfection",
};

// "go-for-it" → "Go for it", for sentences like "Your 'Go for it' review".
export const verdictName = (verdict) =>
  VERDICT_NAMES[verdict] || String(verdict || "").replace(/-/g, " ");

// "1 Follower", "2 Followers".
export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count} ${Number(count) === 1 ? singular : pluralForm}`;
