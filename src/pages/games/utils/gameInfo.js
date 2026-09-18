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

export function getGameCategory(game) {
  const details = game?.name ? gameDetails?.[game.name] : null;
  const genre = String(
    game?.genre || game?.genres || details?.genre || details?.genres || "",
  ).toLowerCase();
  const name = String(game?.name || "").toLowerCase();

  if (genre.includes("racing") || /forza|need for speed|f1/.test(name)) {
    return "Racing";
  }
  if (
    genre.includes("sport") ||
    /ea sports|fc 2\d|nba 2k|fifa|madden|nhl/.test(name)
  ) {
    return "Sports";
  }
  if (genre.includes("rpg")) return "RPG";
  if (genre.includes("adventure")) return "Adventure";
  if (genre.includes("action")) return "Action";

  if (
    /elden ring|witcher|cyberpunk|hogwarts|diablo|baldur|persona|dragon age|fallout/.test(
      name,
    )
  ) {
    return "RPG";
  }
  if (
    /tomb raider|uncharted|last of us|god of war|ghost of tsushima|assassin|adventure|life is strange|little nightmares/.test(
      name,
    )
  ) {
    return "Adventure";
  }
  if (
    /resident evil|silent hill|dead space|alan wake|phasmophobia|forest|sons of the forest|outlast/.test(
      name,
    )
  ) {
    return "Action";
  }

  return "Action";
}

export function matchesHomeCategory(game, category) {
  if (category === "All") return true;

  const details = game?.name ? gameDetails?.[game.name] : null;
  const genre = String(
    game?.genre || game?.genres || details?.genre || details?.genres || "",
  ).toLowerCase();

  if (category === "Action" && genre.includes("action")) return true;
  if (category === "Adventure" && genre.includes("adventure")) return true;
  if (category === "RPG" && genre.includes("rpg")) return true;
  if (category === "Racing" && genre.includes("racing")) return true;
  if (category === "Sports" && genre.includes("sport")) return true;

  return getGameCategory(game) === category;
}
