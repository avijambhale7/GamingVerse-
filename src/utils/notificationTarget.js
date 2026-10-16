/* =========================================================
   WHERE A NOTIFICATION LEADS
   Clicking a notification in the 🔔 bell opens what it's about:
   - a game (verdicts, reviews, Collections / Play Later changes)
   - a section (Marketplace, Café, Feed, Release)
   api/send-push.js uses the same section map for push links.
========================================================= */

// Notification title → Games page section (?view=…).
export const NOTIFICATION_VIEWS = {
  "GamingVerse Market": "marketplace",
  "GamingVerse Café": "cafe",
  "GamingVerse Feed": "spaces",
  "GamingVerse Release": "upcomings",
};

// Titles of notifications about one game.
const GAME_TITLES = new Set(["GamingVerse Verdict", "GamingVerse Review", "GamingVerse"]);

// Older notifications don't store the game, only the sentence:
// "Your 'skip' verdict for Elden Ring was saved."
// "Your 'go for it' review for Elden Ring was posted."
// "Elden Ring was added to Play Later."
function gameFromMessage(message = "") {
  const text = String(message).trim();
  // Anchored on "verdict for"/"review for": the verdict itself can contain
  // "for" ("go for it"), and so can game names ("Need for Speed").
  const verdictOrReview = /\b(?:verdict|review) for (.+?) was (?:saved|posted)\.?$/.exec(text);
  if (verdictOrReview) return verdictOrReview[1];
  const savedList = /^(.+?) was (?:added to|removed from) /.exec(text);
  return savedList ? savedList[1] : "";
}

// { type: "game", name } | { type: "view", view } | null
export function notificationTarget(item) {
  if (!item) return null;
  if (GAME_TITLES.has(item.title)) {
    const name = String(item.game || "").trim() || gameFromMessage(item.message);
    if (name) return { type: "game", name };
  }
  const view = NOTIFICATION_VIEWS[item.title];
  return view ? { type: "view", view } : null;
}
