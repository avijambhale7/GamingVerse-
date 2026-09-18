/* =========================================================
   GAME CATALOGUE
   Loads every local artwork file and merges it with the
   GamingVerse database into one de-duplicated catalogue.
========================================================= */
import gamesData from "../../../data/gamesdata.jsx";
import { PRIORITY_GAME_NAMES } from "../data/priorityGames.js";
import {
  containsBlockedGameTerm,
  localImageSimilarity,
  normalizeGameSearchText,
  normalizePriorityGameName,
} from "./text.js";

/* Load all game images. */
const horizontalImages = import.meta.glob(
  "../../../assets/horizontal/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);
const posterImages = import.meta.glob(
  "../../../assets/Posters/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export function getGameName(path) {
  const fileName = path
    .split("/")
    .pop()
    .replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return fileName
    .replace(/_Horizontal$/i, "")
    .replace(/_Poster$/i, "")
    .replace(/_/g, " ")
    .replace(/RDR2/i, "Red Dead Redemption 2")
    .replace(/RDR/i, "Red Dead Redemption")
    .replace(/GOT/i, "Ghost of Tsushima")
    .replace(/GOW/i, "God of War")
    .replace(/^ACS$/i, "Assassin's Creed Shadows")
    .replace(/^CS2$/i, "Counter Strike 2")
    .replace(/^Wukong$/i, "Black Myth Wukong");
}

export const horizontalGames = Object.entries(horizontalImages)
  .map(([path, image]) => ({
    name: getGameName(path),
    image,
  }))
  .filter((game) => !containsBlockedGameTerm(game.name));

export const posterGames = Object.entries(posterImages)
  .map(([path, image]) => ({
    name: getGameName(path),
    image,
  }))
  .filter((game) => !containsBlockedGameTerm(game.name));

export const databaseGames = Object.entries(gamesData || {})
  .map(([key, details]) => ({
    id: `database-${key}`,
    name: details?.title || key,
    image: "",
    genre: details?.genre || "Game",
    platforms: details?.platforms || "PC • Console • Mobile",
    releaseDate: details?.releaseDate || "",
    developer: details?.developer || "—",
    publisher: details?.publisher || "—",
    description: details?.description || "",
    trailerSearchUrl: details?.trailerSearchUrl || "",
    source: "GamingVerse Database",
    databaseKey: key,
  }))
  .filter((game) => !containsBlockedGameTerm(game.name))
  .filter((game, index, list) => {
    const normalized = normalizeGameSearchText(game.name);
    return (
      list.findIndex(
        (item) => normalizeGameSearchText(item.name) === normalized,
      ) === index
    );
  });

export const getBestLocalCatalogueImage = (game) => {
  const candidates = [game?.name, game?.databaseKey, game?.title].filter(
    Boolean,
  );
  let best = { image: "", score: 0 };

  for (const item of [...posterGames, ...horizontalGames]) {
    if (!item?.image || !item?.name) continue;

    for (const candidate of candidates) {
      const score = localImageSimilarity(candidate, item.name);
      if (score > best.score) best = { image: item.image, score };
    }
  }

  return best.score >= 0.45 ? best.image : "";
};

export const completeGameCatalogue = (() => {
  const result = [];
  const seen = new Set();

  const addGame = (game) => {
    if (!game?.name) return;

    const key = normalizeGameSearchText(game.name);
    if (!key || seen.has(key) || containsBlockedGameTerm(game.name)) return;

    const matchingImage =
      horizontalGames.find((item) => normalizeGameSearchText(item.name) === key)
        ?.image ||
      posterGames.find((item) => normalizeGameSearchText(item.name) === key)
        ?.image ||
      "";

    result.push({
      ...game,
      image: game.image || matchingImage,
    });
    seen.add(key);
  };

  databaseGames.forEach(addGame);
  horizontalGames.forEach(addGame);
  posterGames.forEach(addGame);

  return result;
})();

export const priorityGameRank = new Map(
  PRIORITY_GAME_NAMES.map((name, index) => [
    normalizePriorityGameName(name),
    index,
  ]),
);

// Prevent the automatic catalogue from repeating games that already
// exist in GamingVerse's curated catalogue, including the requested
// priority titles. This keeps the Home sections visually unique.
export const CURATED_GAME_NAME_KEYS = new Set([
  ...horizontalGames.map((game) => normalizePriorityGameName(game.name)),
  ...posterGames.map((game) => normalizePriorityGameName(game.name)),
  ...PRIORITY_GAME_NAMES.map((name) => normalizePriorityGameName(name)),
]);
