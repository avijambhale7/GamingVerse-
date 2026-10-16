/* =========================================================
   AGE RATINGS (pure — unit tested in ageRating.test.js)
   One place that answers "how old must you be for this game?",
   whatever the game is called:

   1. GamingVerse's own rating (data/ageRatings.js) — always wins.
      Matched through gameNameKey(), the alias map and each entry's
      full title in src/data/gamesdata.jsx, so "GTA VI", "GTA 6" and
      "Grand Theft Auto VI" are the same game.
   2. The game's ESRB rating from RAWG (esrbSlug on RAWG games, or
      remembered by name when RAWG results are loaded).
   3. Otherwise 16+ (unknown games stay protected).
========================================================= */
import gamesData, { gamesDataAliases } from "../../../data/gamesdata.jsx";
import { gameAgeRatings } from "../data/ageRatings.js";

const ROMAN = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

// The same key for every spelling of a title:
// "Grand Theft Auto VI" / "GTA 6" / "gta vi" → "gta6",
// "Black Myth: Wukong" → "blackmythwukong", "The Last of Us" → "lastofus".
export function gameNameKey(name = "") {
  const words = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents (Ragnarök → Ragnarok)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`™®©]/g, "")
    .replace(/\bgrand theft auto\b/g, "gta")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => ROMAN[word] || word);
  if (words[0] === "the" && words.length > 1) words.shift();
  return words.join("");
}

// ESRB (RAWG esrb_rating.slug) → minimum age.
const ESRB_AGES = {
  everyone: 7,
  "everyone-10-plus": 10,
  teen: 13,
  mature: 18,
  "adults-only": 18,
};

export function esrbAge(slug) {
  return ESRB_AGES[String(slug || "").toLowerCase()] ?? null;
}

const parseAge = (rating) => {
  const age = Number.parseInt(rating, 10);
  return Number.isFinite(age) ? age : null;
};

// GamingVerse ratings by name key, including every alias and full title.
function buildGamingVerseRatings() {
  const byKey = new Map();
  Object.entries(gameAgeRatings).forEach(([name, rating]) => {
    const age = parseAge(rating);
    if (age !== null) byKey.set(gameNameKey(name), age);
  });
  const link = (from, to) => {
    const age = byKey.get(gameNameKey(to));
    if (age !== undefined && !byKey.has(gameNameKey(from))) {
      byKey.set(gameNameKey(from), age);
    }
  };
  Object.entries(gamesDataAliases || {}).forEach(([alias, target]) => {
    link(alias, target);
    link(target, alias);
  });
  Object.entries(gamesData || {}).forEach(([key, entry]) => {
    if (entry?.title) {
      link(entry.title, key);
      link(key, entry.title);
    }
  });
  return byKey;
}

const gamingVerseRatings = buildGamingVerseRatings();

export function gamingVerseAge(name) {
  return gamingVerseRatings.get(gameNameKey(name)) ?? null;
}

// ESRB ratings seen in RAWG results (latest, upcoming, search, details),
// so a game shown later without its RAWG data still gets its rating.
const rememberedEsrb = new Map();

export function rememberEsrbRating(name, slug) {
  if (esrbAge(slug) === null) return;
  const key = gameNameKey(name);
  if (key) rememberedEsrb.set(key, String(slug).toLowerCase());
}

export const DEFAULT_REQUIRED_AGE = 16;

// Minimum age for a game (object or name).
export function requiredGameAge(gameOrName) {
  const game = typeof gameOrName === "object" && gameOrName ? gameOrName : null;
  const name = game ? game.name : gameOrName;

  const own = gamingVerseAge(name);
  if (own !== null) return own;

  const fromEsrb =
    esrbAge(game?.esrbSlug) ?? esrbAge(rememberedEsrb.get(gameNameKey(name)));
  if (fromEsrb !== null) return fromEsrb;

  return DEFAULT_REQUIRED_AGE;
}

// Drops later copies of the same title (by gameNameKey) and swaps a
// RAWG game for the GamingVerse catalogue entry when there is one,
// keeping RAWG's release date / id / ESRB rating.
export function dedupeGames(list = [], catalogue = []) {
  const catalogueByKey = new Map();
  (Array.isArray(catalogue) ? catalogue : []).forEach((entry) => {
    const key = gameNameKey(entry?.name);
    if (key && !catalogueByKey.has(key)) catalogueByKey.set(key, entry);
  });

  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((game) => {
    const key = gameNameKey(game?.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const entry = catalogueByKey.get(key);
    if (entry && entry !== game) {
      out.push({
        ...game,
        ...entry,
        releaseDate: game.releaseDate || entry.releaseDate,
        ...(game.rawgId ? { rawgId: game.rawgId } : {}),
        ...(game.esrbSlug ? { esrbSlug: game.esrbSlug } : {}),
      });
    } else {
      out.push(game);
    }
  });
  return out;
}
