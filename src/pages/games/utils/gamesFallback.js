/* =========================================================
   GAMES FALLBACK (pure — unit tested in gamesFallback.test.js)
   When the live game list (RAWG) can't be loaded, the Games page
   shows the last list it saved instead of an empty section, and
   Upcoming falls back to built-in games with a future release
   date. Used by ../../Games.jsx.
========================================================= */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));
const pad = (n) => String(n).padStart(2, "0");

function monthIndex(word = "") {
  const w = String(word).toLowerCase().replace(/\.$/, "");
  const full = MONTHS.indexOf(w);
  return full >= 0 ? full : SHORT_MONTHS.indexOf(w.slice(0, 3));
}

// "19 November 2026", "Nov 19, 2026" or "2026-11-19" → "2026-11-19";
// "" for anything else ("TBA", "—", "2026").
export function releaseDateISO(value = "") {
  const text = String(value || "").trim();
  let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = /^(\d{1,2})\s+([A-Za-z]+\.?)\s+(\d{4})$/.exec(text);
  if (match && monthIndex(match[2]) >= 0) {
    return `${match[3]}-${pad(monthIndex(match[2]) + 1)}-${pad(match[1])}`;
  }
  match = /^([A-Za-z]+\.?)\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  if (match && monthIndex(match[1]) >= 0) {
    return `${match[3]}-${pad(monthIndex(match[1]) + 1)}-${pad(match[2])}`;
  }
  return "";
}

// Whether a release date ("19 November 2026", "2026-11-19", …) is after
// today. Compares real dates — comparing the raw text put
// "19 November 2026" before "2026-…" and dropped every built-in game.
export function isUpcomingRelease(releaseDate, todayISO = "") {
  const iso = releaseDateISO(releaseDate);
  return Boolean(iso) && iso > todayISO;
}

// Built-in games that haven't come out yet (release date after today),
// soonest first. `games`: [{ name, releaseDate, … }].
export function futureGames(games = [], todayISO = "") {
  return (Array.isArray(games) ? games : [])
    .map((game) => ({ game, iso: releaseDateISO(game?.releaseDate) }))
    .filter(({ iso }) => iso && iso > todayISO)
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .map(({ game }) => game);
}

// The saved live list from localStorage, whatever its age, or null if
// there's nothing usable.
export function readSavedGames(rawJson) {
  try {
    const saved = JSON.parse(rawJson || "null");
    if (
      saved?.savedAt &&
      Array.isArray(saved.automaticGames) &&
      Array.isArray(saved.upcomingGames) &&
      (saved.automaticGames.length || saved.upcomingGames.length)
    ) {
      return saved;
    }
  } catch {
    // unreadable — treat as nothing saved
  }
  return null;
}

// "Showing games saved on 12 Oct 2026." (fixed format, any locale)
export function savedOnLabel(savedAt) {
  const date = new Date(Number(savedAt));
  if (!savedAt || Number.isNaN(date.getTime())) return "";
  const month = MONTHS[date.getMonth()].slice(0, 3);
  return `Showing games saved on ${date.getDate()} ${month[0].toUpperCase()}${month.slice(1)} ${date.getFullYear()}.`;
}
