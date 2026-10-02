/* =========================================================
   AUTOMATIC GAME CATALOGUE (RAWG)
   RAWG supplies the live PC + PlayStation + Xbox game data behind
   "Latest PC & Console Games" and "Upcoming Games".

   The browser never sees the API key: every request goes to our own
   /api/rawg (api/rawg.js), which adds the key on the server and lets
   Vercel cache the answer. The key is the VITE_RAWG_API_KEY (or
   RAWG_API_KEY) environment variable — in Vercel for the live site,
   and in .env.local for `npm run dev`.
========================================================= */
import { containsBlockedGameTerm } from "./text.js";

/* RAWG calls are always routed through the server proxy. */
export const RAWG_ENABLED = true;

const RAWG_ALLOWED_PLATFORM_SLUGS = new Set([
  "pc",
  "playstation4",
  "playstation5",
  "xbox-one",
  "xbox-series-x",
  "xbox-series-s",
]);

function rawgRatingToGamingVerse(rating) {
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
