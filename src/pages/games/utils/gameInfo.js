/* =========================================================
   GAME INFORMATION
   Merges curated, database and live details into one shape,
   plus the home-page category helpers.
========================================================= */
import gamesData from "../../../data/gamesdata.jsx";
import { gameDetails } from "../data/gameDetails.js";
import { richGameDetails } from "../data/richGameDetails.js";
import { getGameMediaFallback, getVerifiedTrailerUrl } from "./media.js";
import { normalizeGameSearchText } from "./text.js";

/* Live RAWG lookups are memoised here for the lifetime of the page. */
export const automaticGameDetailsCache = {};

export function getGameDetails(gameName) {
  const databaseDetails =
    gamesData?.[gameName] ||
    Object.values(gamesData || {}).find(
      (item) =>
        normalizeGameSearchText(item?.title) ===
        normalizeGameSearchText(gameName),
    );

  const details = gameDetails[gameName] ||
    automaticGameDetailsCache[gameName] ||
    databaseDetails || {
      title: gameName,
      description:
        "Explore the game, discover its world, gameplay, platforms and community verdict on GamingVerse.",
      genre: "Game",
      platforms: "PC • Console • Mobile",
      releaseDate: "—",
      developer: "—",
      publisher: "—",
      trailerUrl: "",
    };
  const rich = richGameDetails[gameName] || {};
  const mediaFallback = getGameMediaFallback(gameName) || {};
  const verifiedTrailerUrl =
    getVerifiedTrailerUrl(gameName) || mediaFallback.trailer || "";
  const trailerSearchUrl =
    details.trailerSearchUrl ||
    rich.trailerSearchUrl ||
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details.title || gameName} official trailer`)}`;
  return {
    ...details,
    ...rich,
    title: details.title || databaseDetails?.title || gameName,
    description:
      details.description ||
      databaseDetails?.description ||
      "Explore the game, discover its world, gameplay, platforms and community verdict on GamingVerse.",
    genre: details.genre || databaseDetails?.genre || "Game",
    platforms:
      details.platforms ||
      databaseDetails?.platforms ||
      "PC • Console • Mobile",
    releaseDate: details.releaseDate || databaseDetails?.releaseDate || "—",
    developer: details.developer || databaseDetails?.developer || "—",
    publisher: details.publisher || databaseDetails?.publisher || "—",
    trailerSearchUrl,
    trailerUrl: verifiedTrailerUrl || details.trailerUrl || "",
  };
}

/* Every genre string known for a game: its own field (RAWG games), the
   curated details and the main games database. "Game" is the
   placeholder for "unknown" and is ignored. */
function getGenreText(game) {
  const name = String(game?.name || "");
  const own = game?.genre || game?.genres || "";
  const known = name ? getGameDetails(name).genre : "";
  return [own, known]
    .map((value) => String(value || ""))
    .filter((value) => value && value !== "Game")
    .join(" • ")
    .toLowerCase();
}

const NAME_HINTS = {
  Racing: /forza|need for speed|\bf1\b|gran turismo|mario kart|the crew/,
  Sports: /ea sports|\bfc 2\d|nba 2k|fifa|madden|nhl|efootball|wwe 2k|pga tour/,
  RPG: /elden ring|witcher|cyberpunk|hogwarts|diablo|baldur|persona|dragon age|fallout|final fantasy|starfield|skyrim|mass effect/,
  Adventure:
    /tomb raider|uncharted|last of us|god of war|ghost of tsushima|assassin|adventure|life is strange|little nightmares|zelda/,
  Action:
    /resident evil|silent hill|dead space|alan wake|outlast|call of duty|battlefield|doom|devil may cry|halo/,
};

/* All home-page categories a game belongs to (possibly none). */
export function getGameCategories(game) {
  const genre = getGenreText(game);
  const name = String(game?.name || "").toLowerCase();
  const has = (pattern) => pattern.test(genre);

  // Racing and sports games are only that, even when their genre also
  // says "Open World" (Forza) or "Multiplayer".
  if (has(/racing|formula 1/) || NAME_HINTS.Racing.test(name)) {
    return ["Racing"];
  }
  if (
    has(/sport|football|basketball|soccer|cricket|tennis|golf/) ||
    NAME_HINTS.Sports.test(name)
  ) {
    return ["Sports"];
  }

  const categories = [];
  if (
    has(/action|shooter|fps|battle royale|hack and slash|fighting|rogue|stealth|superhero|arcade/) ||
    NAME_HINTS.Action.test(name)
  ) {
    categories.push("Action");
  }
  if (
    has(/adventure|open world|story|metroidvania|platformer|survival|horror|sandbox|exploration|puzzle/) ||
    NAME_HINTS.Adventure.test(name)
  ) {
    categories.push("Adventure");
  }
  if (has(/rpg|role.playing|soulslike/) || NAME_HINTS.RPG.test(name)) {
    categories.push("RPG");
  }
  return categories;
}

/* A single main category (used as a card label when a game has no
   genre text of its own). "Action RPG" counts as RPG. Defaults to
   Action. */
export function getGameCategory(game) {
  const categories = getGameCategories(game);
  if (categories.includes("RPG")) return "RPG";
  return categories[0] || "Action";
}

/* Short genre label for a game card: the first genre from the
   game's details ("Racing • Open World" → "Racing"), or its
   home-page category when no genre is known. */
export function getGameGenreLabel(game) {
  const genre = getGameDetails(game?.name || "").genre;
  const first = String(genre || "")
    .split(/[•,/|]/)[0]
    .trim();
  return first && first !== "Game" ? first : getGameCategory(game);
}

/* Games that fit none of the five categories (e.g. Among Us) only
   show under "All" — they are no longer lumped into Action. */
export function matchesHomeCategory(game, category) {
  if (category === "All") return true;
  return getGameCategories(game).includes(category);
}
