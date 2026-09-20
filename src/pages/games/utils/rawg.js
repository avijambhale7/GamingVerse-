/* =========================================================
   AUTOMATIC GAME CATALOGUE (RAWG)
   RAWG supplies the live PC + PlayStation + Xbox game data behind
   "Latest PC & Console Games" and "Upcoming Games".
   (Redeploy trigger: forces a clean Vercel build to pick up the
   newly-added VITE_RAWG_API_KEY environment variable.)

   WHERE TO PUT YOUR API KEY
   Get one free at https://rawg.io/apidocs, then either:

   1. Preferred — create a file named `.env.local` next to
      package.json containing exactly:

          VITE_RAWG_API_KEY=your_key_here

      then stop and restart `npm run dev`. Vite only reads env
      files at startup, so a running server will not pick it up.
      `.env.local` is git-ignored, so the key stays out of the repo.

   2. Quick demo alternative — paste it into FALLBACK_RAWG_API_KEY
      below. Note this ships the key inside the browser bundle and
      commits it to git history, so anyone can read and use it.
========================================================= */
import { containsBlockedGameTerm } from "./text.js";

const FALLBACK_RAWG_API_KEY = "";

const configuredKey = String(
  import.meta.env.VITE_RAWG_API_KEY || FALLBACK_RAWG_API_KEY || "",
).trim();

/* This key was hardcoded in earlier versions of GamingVerse and has since
   used up its monthly quota for good - RAWG answers every request with
   401 "The monthly API limit reached". That 401 carries no CORS headers,
   so the browser hides the status and fetch() just reports "Failed to
   fetch", which looks like the network is down. Recognising the key here
   turns that dead end into an instruction. */
const EXHAUSTED_DEMO_KEYS = new Set(["96ce35c844ec40458f1b56cc62037d3c"]);

export const RAWG_KEY_IS_EXHAUSTED_DEMO = EXHAUSTED_DEMO_KEYS.has(configuredKey);

/* Reported as unset so every `!RAWG_API_KEY` guard skips the doomed calls. */
export const RAWG_API_KEY = RAWG_KEY_IS_EXHAUSTED_DEMO ? "" : configuredKey;

export const RAWG_ALLOWED_PLATFORM_SLUGS = new Set([
  "pc",
  "playstation4",
  "playstation5",
  "xbox-one",
  "xbox-series-x",
  "xbox-series-s",
]);

export function rawgRatingToGamingVerse(rating) {
  const slug = String(rating?.slug || "").toLowerCase();

  if (slug === "adults-only") return "18+";
  if (slug === "mature") return "18+";
  if (slug === "teen") return "16+";
  if (slug === "everyone-10-plus") return "12+";
  if (slug === "everyone") return "7+";

  // Unknown/unrated automatic games stay protected.
  return "16+";
}

export function rawgGameHasAllowedPlatform(game) {
  return (
    Array.isArray(game?.platforms) &&
    game.platforms.some((entry) =>
      RAWG_ALLOWED_PLATFORM_SLUGS.has(entry?.platform?.slug),
    )
  );
}

export function rawgGameIsSafe(game) {
  const text = [
    game?.name,
    game?.slug,
    game?.description,
    game?.esrb_rating?.name,
    game?.esrb_rating?.slug,
    ...(Array.isArray(game?.tags) ? game.tags.map((tag) => tag?.name) : []),
  ]
    .filter(Boolean)
    .join(" ");

  return !containsBlockedGameTerm(text);
}

export function mapRawgGame(game) {
  const platformNames = Array.from(
    new Set(
      (game?.platforms || [])
        .filter((entry) =>
          RAWG_ALLOWED_PLATFORM_SLUGS.has(entry?.platform?.slug),
        )
        .map((entry) => entry?.platform?.name)
        .filter(Boolean),
    ),
  );

  const genre =
    Array.isArray(game?.genres) && game.genres.length
      ? game.genres
          .map((item) => item?.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(" • ")
      : "Game";

  const ageRating = rawgRatingToGamingVerse(game?.esrb_rating);
  const displayName = String(game?.name || "").trim();
  const developerName =
    Array.isArray(game?.developers) && game.developers.length
      ? game.developers
          .map((item) => item?.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(" • ")
      : "—";
  const publisherName =
    Array.isArray(game?.publishers) && game.publishers.length
      ? game.publishers
          .map((item) => item?.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(" • ")
      : "—";

  const rawgTrailerUrl = game?.clip?.clip || game?.clips?.clip || "";

  return {
    id: `rawg-${game.id}`,
    rawgId: game.id,
    name: displayName,
    image: game.background_image || "",
    trailerUrl: rawgTrailerUrl,
    ageRating,
    genre,
    rating: Number.isFinite(Number(game?.rating)) ? Number(game.rating) : 0,
    ratingCount: Number.isFinite(Number(game?.ratings_count))
      ? Number(game.ratings_count)
      : 0,
    releaseDate: game?.released || "",
    platforms: platformNames.length
      ? platformNames.join(" • ")
      : "PC • Console",
    developer: developerName,
    publisher: publisherName,
    source: "RAWG",
  };
}
