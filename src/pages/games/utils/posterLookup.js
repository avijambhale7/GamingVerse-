/* =========================================================
   POSTER LOOKUP
   Finds a missing game's poster art from RAWG. Shared by the
   Games page (background fill for the whole catalogue) and the
   Admin panel (fill-in for whatever the browse list is short a
   poster for), so a search only ever needs to happen once — both
   read and write the same gamingverse_poster_image_cache_v1
   localStorage cache.
========================================================= */
import { RAWG_API_KEY } from "./rawg.js";
import {
  containsBlockedGameTerm,
  localImageSimilarity,
  normalizeCatalogueImageKey,
} from "./text.js";

export const POSTER_CACHE_KEY = "gamingverse_poster_image_cache_v1";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function readPosterImageCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(POSTER_CACHE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writePosterImageCache(foundImages) {
  if (!foundImages || !Object.keys(foundImages).length) return;
  try {
    const existing = readPosterImageCache();
    localStorage.setItem(
      POSTER_CACHE_KEY,
      JSON.stringify({ ...existing, ...foundImages }),
    );
  } catch {
    // Storage full/unavailable — callers keep working, just without the
    // cache, so the next lookup searches RAWG again.
  }
}

function getSearchCandidates(game) {
  const raw = [game?.name, game?.databaseKey, game?.title]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const expanded = [...raw];
  raw.forEach((value) => {
    expanded.push(
      value
        .replace(/^Marvel's\s+/i, "")
        .replace(/^Tom Clancy's\s+/i, "")
        .replace(/^EA Sports\s+/i, "")
        .replace(/^Grand Theft Auto\s+/i, "GTA ")
        .replace(/^Counter-Strike\s+/i, "Counter Strike "),
    );
  });

  if (/spider.?man/i.test(game?.name || "")) {
    expanded.push("Spider-Man", "Marvel Spider-Man");
  }
  if (/star wars jedi/i.test(game?.name || "")) {
    expanded.push(game.name.replace(/:/g, ""));
  }

  return [...new Set(expanded.map((x) => x.trim()).filter(Boolean))];
}

function chooseBestRawgResult(results, game) {
  const wanted = normalizeCatalogueImageKey(game?.name || "");
  const safe = results.filter(
    (item) =>
      item?.name && item?.background_image && !containsBlockedGameTerm(item.name),
  );

  safe.sort((a, b) => {
    const aScore = localImageSimilarity(wanted, a.name);
    const bScore = localImageSimilarity(wanted, b.name);
    if (bScore !== aScore) return bScore - aScore;
    return (Number(b?.rating) || 0) - (Number(a?.rating) || 0);
  });

  return safe[0] || null;
}

/* Searches RAWG for one game's poster. Returns { gameKey, image } or null. */
export async function lookupGameImage(game) {
  if (!RAWG_API_KEY) return null;

  for (const candidate of getSearchCandidates(game)) {
    try {
      const endpoint =
        `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_API_KEY)}` +
        `&search=${encodeURIComponent(candidate)}` +
        `&page_size=10` +
        `&search_precise=true`;

      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 429) await sleep(1200);
        continue;
      }

      const data = await response.json();
      const result = chooseBestRawgResult(
        Array.isArray(data?.results) ? data.results : [],
        game,
      );

      if (result?.background_image) {
        return {
          gameKey: normalizeCatalogueImageKey(game.name),
          image: result.background_image,
        };
      }
    } catch (error) {
      console.warn(`Poster lookup failed for ${candidate}:`, error);
    }
  }

  return null;
}

/* Resolves posters for a list of games in small batches (kind to RAWG's
   rate limit), skipping anything already in `knownImages`. Calls
   onBatchFound after each batch with the images found so far in this run,
   so a caller can update UI incrementally instead of waiting for all of
   them. Returns the full set of newly-found images. */
export async function lookupMissingPosters(
  games,
  knownImages,
  { batchSize = 3, batchDelayMs = 180, isCancelled, onBatchFound } = {},
) {
  const missing = games.filter((game) => {
    const key = normalizeCatalogueImageKey(game?.name || "");
    return key && !knownImages[key];
  });

  const foundImages = {};

  for (let index = 0; index < missing.length; index += batchSize) {
    if (isCancelled?.()) break;

    const batch = missing.slice(index, index + batchSize);
    const results = await Promise.all(batch.map((game) => lookupGameImage(game)));

    const batchFound = {};
    results.forEach((result) => {
      if (result?.gameKey && result?.image) {
        foundImages[result.gameKey] = result.image;
        batchFound[result.gameKey] = result.image;
      }
    });

    if (Object.keys(batchFound).length) {
      writePosterImageCache(batchFound);
      onBatchFound?.(batchFound);
    }

    if (isCancelled?.()) break;
    await sleep(batchDelayMs);
  }

  return foundImages;
}
