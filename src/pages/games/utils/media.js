/* =========================================================
   GAME MEDIA
   Resolves the poster, hero artwork and trailer for a game.
========================================================= */
import {
  GAME_MEDIA_FALLBACKS,
  VERIFIED_YOUTUBE_TRAILERS,
} from "../data/trailers.js";
import { horizontalGames, posterGames } from "./catalogue.js";
import {
  localImageSimilarity,
  normalizeGameSearchText,
  normalizeTrailerGameName,
} from "./text.js";

export const trailerMapByNormalizedName = Object.fromEntries(
  Object.entries(VERIFIED_YOUTUBE_TRAILERS).map(([name, url]) => [
    normalizeTrailerGameName(name),
    url,
  ]),
);

export function getVerifiedTrailerUrl(gameName = "") {
  return trailerMapByNormalizedName[normalizeTrailerGameName(gameName)] || "";
}

export function extractYouTubeId(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";

  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    /^([A-Za-z0-9_-]{6,})$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

export function toYouTubeEmbedUrl(value = "") {
  const id = extractYouTubeId(value);
  if (!id) return "";
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
}

export const getGameMediaFallback = (gameName = "") => {
  const normalized = normalizeGameSearchText(gameName);
  const key = Object.keys(GAME_MEDIA_FALLBACKS).find(
    (name) => normalizeGameSearchText(name) === normalized,
  );
  return key ? GAME_MEDIA_FALLBACKS[key] : null;
};

export const getBestLocalImage = (game, sourceList) => {
  const candidates = [game?.name, game?.databaseKey, game?.title].filter(
    Boolean,
  );
  let best = { image: "", score: 0 };

  for (const item of sourceList) {
    if (!item?.image || !item?.name) continue;
    for (const candidate of candidates) {
      const score = localImageSimilarity(candidate, item.name);
      if (score > best.score) best = { image: item.image, score };
    }
  }

  return best.score >= 0.34 ? best.image : "";
};

export const resolveGameMedia = (game) => {
  const name = String(game?.name || "").trim();
  const fallback = getGameMediaFallback(name) || {};
  const verifiedTrailer = getVerifiedTrailerUrl(name);

  // Prefer an actual local poster, then an already-discovered RAWG image,
  // then the game's own image.
  const poster =
    getBestLocalImage(game, posterGames) ||
    game?.image ||
    fallback.poster ||
    (verifiedTrailer
      ? `https://i.ytimg.com/vi/${extractYouTubeId(verifiedTrailer)}/hqdefault.jpg`
      : "");

  const hero =
    game?.heroImage ||
    getBestLocalImage(game, horizontalGames) ||
    game?.image ||
    fallback.hero ||
    poster ||
    (verifiedTrailer
      ? `https://i.ytimg.com/vi/${extractYouTubeId(verifiedTrailer)}/hqdefault.jpg`
      : "");

  const trailer = verifiedTrailer || game?.trailerUrl || fallback.trailer || "";

  return { poster, hero, trailer };
};
