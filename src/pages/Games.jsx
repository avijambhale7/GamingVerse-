/*
  GAMINGVERSE - GAMES PAGE
  Structure:
  01. Imports
  02. Asset loading
  03. Game metadata
  04. Review metadata
  05. Games component state
  06. Effects / Firebase
  07. Saved-game actions
  08. Review actions
  09. Meter calculations
  10. Page views
  11. Game details modal
  12. Meter modal
  13. Footer
*/
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Games.css";
import Marketplace from "./Marketplace";
import Cafe from "./Cafe";
import { onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { db, auth } from "../firebase";
import gamesData from "../data/gamesdata.jsx";
/* =========================================================
   LOAD ALL GAME IMAGES
========================================================= */
const horizontalImages = import.meta.glob(
  "../assets/horizontal/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);
const posterImages = import.meta.glob(
  "../assets/Posters/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);
/* =========================================================
   HOME CATALOGUE SAFETY / CATEGORY HELPERS
========================================================= */
const RAWG_BLOCKED_TERMS = [
  "blue whale",
  "self harm challenge",
  "suicide challenge",
  "dangerous challenge",
  "being a dik",
  "acting lessons",
  "toys 18+",
  "rainy waifu",
  "waifu gamers",
  "holy waifu",
  "hot holes",
  "hot foots",
  "hot feet",
  "sex secret",
  "love 2077",
  "desktop companion",
  "alt girl",
  "waifu",
  "hentai",
  "ecchi",
  "eroge",
  "porn",
  "pornographic",
  "nsfw",
  "adult only",
  "adult game",
  "adult visual novel",
  "sexual content",
  "sexual themes",
  "sexually explicit",
  "explicit sexual",
  "nudity",
  "nude",
  "naked",
  "fetish",
  "foot fetish",
  "lustful",
  "lewd",
  "uncensored",
  "erotic",
  "erotica",
  "sexualized",
  "sexualised",
  "femboy",
  "fembot",
];

function normalizeGameSearchText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsBlockedGameTerm(value = "") {
  const text = normalizeGameSearchText(value);
  return RAWG_BLOCKED_TERMS.some((term) =>
    text.includes(normalizeGameSearchText(term)),
  );
}

function getGameCategory(game) {
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

function matchesHomeCategory(game, category) {
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

/* =========================================================
   GAME NAME
========================================================= */
function getGameName(path) {
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
const horizontalGames = Object.entries(horizontalImages)
  .map(([path, image]) => ({
    name: getGameName(path),
    image,
  }))
  .filter((game) => !containsBlockedGameTerm(game.name));

const posterGames = Object.entries(posterImages)
  .map(([path, image]) => ({
    name: getGameName(path),
    image,
  }))
  .filter((game) => !containsBlockedGameTerm(game.name));

const databaseGames = Object.entries(gamesData || {})
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

const normalizeCatalogueImageKey = (value = "") =>
  normalizeGameSearchText(value)
    .replace(/\bthe\b/g, " ")
    .replace(/\bmarvels\b/g, " ")
    .replace(/\btom clancys\b/g, " ")
    .replace(/\bea sports\b/g, " ")
    .replace(/\bremastered\b/g, " ")
    .replace(/\bthe end\b/g, " end ")
    .replace(/\s+/g, " ")
    .trim();

const imageNameTokens = (value = "") =>
  new Set(
    normalizeCatalogueImageKey(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 1),
  );

const localImageSimilarity = (a = "", b = "") => {
  const left = imageNameTokens(a);
  const right = imageNameTokens(b);
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });

  return intersection / Math.max(left.size, right.size);
};

const getBestLocalCatalogueImage = (game) => {
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

const completeGameCatalogue = (() => {
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
/* =========================================================
   REVIEW OPTIONS
========================================================= */
/* =========================================================
   GAMINGVERSE CURATED COLLECTIONS
========================================================= */
const reviewOptions = [
  {
    id: "perfection",
    icon: "💜",
    title: "PERFECTION",
    description: "Must-play game",
  },
  {
    id: "go-for-it",
    icon: "🟢",
    title: "GO FOR IT",
    description: "Definitely worth playing",
  },
  {
    id: "timepass",
    icon: "🟡",
    title: "TIMEPASS",
    description: "Fun for casual gaming",
  },
  {
    id: "skip",
    icon: "🔴",
    title: "SKIP",
    description: "Not recommended",
  },
];
function createGameId(gameName) {
  return gameName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
const emptyCounts = {
  perfection: 0,
  "go-for-it": 0,
  timepass: 0,
  skip: 0,
};
/* =========================================================
   GAME DETAILS
   Add more games here as your asset library grows.
   trailerUrl can be a YouTube embed URL for the official trailer.
========================================================= */
const VERIFIED_YOUTUBE_TRAILERS = {
  "GTA V": "https://www.youtube.com/embed/hvoD7ehZPcM",
  Hades: "https://www.youtube.com/embed/Bz8l935Bv0Y",
  "Cyberpunk 2077": "https://www.youtube.com/embed/8X2kIfS6fb8",
  "Assassin's Creed Shadows": "https://www.youtube.com/embed/vovkzbtYBC8",
  "Among Us": "https://www.youtube.com/embed/NSJ4cESNQfE",
  "Black Myth Wukong": "https://www.youtube.com/embed/0Zw-mo0EFt0",
  "Counter Strike 2": "https://www.youtube.com/embed/nSE38xjMLqE",
  "Ghost of Tsushima": "https://www.youtube.com/embed/kSAvzeopPC8",
  "GTA VI": "https://www.youtube.com/embed/VQRLujxTm3c",
  "God of War Ragnarok": "https://www.youtube.com/embed/g1wr0DfV73E",
  "God of War": "https://www.youtube.com/embed/lRhzFqA1f7o",
  "Hogwarts Legacy": "https://www.youtube.com/embed/BtyBjOW8sGY",
  Minecraft: "https://www.youtube.com/embed/Rla3FUlxJdE",
  "Red Dead Redemption 2": "https://www.youtube.com/embed/Dw_oH5oiUSE",
  "Elden Ring Nightreign": "https://www.youtube.com/embed/AWrXpJQBJF0",
  "Far Cry 6": "https://www.youtube.com/embed/qjSM3Lp7EhI",
  "Far Cry 5": "https://www.youtube.com/embed/Kdaoe4hbMso",
  "Mafia III": "https://www.youtube.com/embed/YYhlmUd9Xoc",
  "Just Cause 4": "https://www.youtube.com/embed/pvhzeV0kjc8",
  "Marvel's Spider-Man 2": "https://www.youtube.com/embed/9fVYKsEmuRo",
  "Uncharted 4: A Thief's End": "https://www.youtube.com/embed/D3pYbbA1kfk",
  "Sekiro: Shadows Die Twice": "https://www.youtube.com/embed/rXMX4YJ7Lks",
  "Star Wars Jedi: Fallen Order": "https://www.youtube.com/embed/xIl2z5wwjdA",
  "Star Wars Jedi: Survivor": "https://www.youtube.com/embed/VRaobDJjiec",
  "The Last of Us Part II": "https://www.youtube.com/embed/W2Wnvvj33Wo",
  "The Last of Us Part I": "https://www.youtube.com/embed/WxjeV10H1F0",
  "Rise of the Tomb Raider": "https://www.youtube.com/embed/qiYiddjc6cU",
  "Shadow of the Tomb Raider": "https://www.youtube.com/embed/XYtyeqVQnRI",
  "Resident Evil 4": "https://www.youtube.com/embed/H94wplkA99s",
  "Resident Evil Village": "https://www.youtube.com/embed/uIdjcDTc9Vk",
  "Silent Hill 2": "https://www.youtube.com/embed/0JHD_vb4jxE",
  "Alan Wake 2": "https://www.youtube.com/embed/MEWgOlTIW4Y",
  "Hades II": "https://www.youtube.com/embed/ppEKFy83w-o",
  "Dota 2": "https://www.youtube.com/embed/9B7G4Y2EKaA",
  VALORANT: "https://www.youtube.com/embed/IhhjcB2ZjIM",
};

const GAME_MEDIA_FALLBACKS = {
  "PUBG: Battlegrounds": {
    poster:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/library_600x900_2x.jpg",
    hero: "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/library_hero.jpg",
    trailer: "https://www.youtube.com/embed/u1oqfdh4xBY",
  },
  "Dota 2": {
    poster: "https://i.ytimg.com/vi/9B7G4Y2EKaA/maxresdefault.jpg",
    hero: "https://i.ytimg.com/vi/9B7G4Y2EKaA/maxresdefault.jpg",
    trailer: "https://www.youtube.com/embed/9B7G4Y2EKaA",
  },
  VALORANT: {
    poster: "https://i.ytimg.com/vi/IhhjcB2ZjIM/maxresdefault.jpg",
    hero: "https://i.ytimg.com/vi/IhhjcB2ZjIM/maxresdefault.jpg",
    trailer: "https://www.youtube.com/embed/IhhjcB2ZjIM",
  },
};

const getGameMediaFallback = (gameName = "") => {
  const normalized = normalizeGameSearchText(gameName);
  const key = Object.keys(GAME_MEDIA_FALLBACKS).find(
    (name) => normalizeGameSearchText(name) === normalized,
  );
  return key ? GAME_MEDIA_FALLBACKS[key] : null;
};

const getBestLocalImage = (game, sourceList) => {
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

const resolveGameMedia = (game) => {
  const name = String(game?.name || "").trim();
  const fallback = getGameMediaFallback(name) || {};
  const verifiedTrailer = getVerifiedTrailerUrl(name);

  const exactCatalogueImage = (() => {
    const key = normalizeCatalogueImageKey(name);
    return key && typeof catalogueImageMap !== "undefined"
      ? catalogueImageMap[key] || ""
      : "";
  })();

  // Prefer an actual local poster, then an already-discovered RAWG image,
  // then the game's own image.
  const poster =
    getBestLocalImage(game, posterGames) ||
    exactCatalogueImage ||
    game?.image ||
    fallback.poster ||
    (verifiedTrailer
      ? `https://i.ytimg.com/vi/${extractYouTubeId(verifiedTrailer)}/hqdefault.jpg`
      : "");

  const hero =
    game?.heroImage ||
    getBestLocalImage(game, horizontalGames) ||
    game?.image ||
    exactCatalogueImage ||
    fallback.hero ||
    poster ||
    (verifiedTrailer
      ? `https://i.ytimg.com/vi/${extractYouTubeId(verifiedTrailer)}/hqdefault.jpg`
      : "");

  const trailer = verifiedTrailer || game?.trailerUrl || fallback.trailer || "";

  return { poster, hero, trailer };
};

const normalizeTrailerGameName = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’':.!,-]/g, "")
    .replace(/\bragnarok\b/g, "ragnarok")
    .replace(/\bthe last of us part 2\b/g, "the last of us part ii")
    .replace(/\bthe last of us part 1\b/g, "the last of us part i")
    .replace(/\bgrand theft auto 6\b/g, "gta vi")
    .replace(/\bgrand theft auto 5\b/g, "gta v")
    .replace(/\bcounter strike 2\b/g, "counter strike 2")
    .replace(/\s+/g, " ")
    .trim();

const trailerMapByNormalizedName = Object.fromEntries(
  Object.entries(VERIFIED_YOUTUBE_TRAILERS).map(([name, url]) => [
    normalizeTrailerGameName(name),
    url,
  ]),
);

function getVerifiedTrailerUrl(gameName = "") {
  return trailerMapByNormalizedName[normalizeTrailerGameName(gameName)] || "";
}

function extractYouTubeId(value = "") {
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

function toYouTubeEmbedUrl(value = "") {
  const id = extractYouTubeId(value);
  if (!id) return "";
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
}

const gameDetails = {
  Hades: {
    title: "Hades",
    description:
      "A fast-paced action roguelike from Supergiant Games, focused on repeated escape attempts from the Underworld.",
    genre: "Action • Roguelike",
    platforms: "PC • Nintendo Switch • PlayStation • Xbox",
    releaseDate: "17 September 2020",
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    trailerUrl: "https://www.youtube.com/embed/Bz8l935Bv0Y",
  },
  "GTA V": {
    title: "Grand Theft Auto V",
    description:
      "An open-world action-adventure game set in Los Santos, featuring a story campaign and an expansive online mode.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "17 September 2013",
    developer: "Rockstar North",
    publisher: "Rockstar Games",
    trailerUrl: "https://www.youtube.com/embed/hvoD7ehZPcM",
  },
  "Cyberpunk 2077": {
    title: "Cyberpunk 2077",
    description:
      "An open-world action RPG set in Night City, where players take on the role of V in a futuristic adventure.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "10 December 2020",
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    trailerUrl: "https://www.youtube.com/embed/8X2kIfS6fb8",
  },
  "Assassin's Creed Shadows": {
    title: "Assassin's Creed Shadows",
    description:
      "An action-adventure game set in feudal Japan with stealth, exploration and two playable protagonists.",
    genre: "Action • Stealth • Open World",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "20 March 2025",
    developer: "Ubisoft Quebec",
    publisher: "Ubisoft",
    trailerUrl: "https://www.youtube.com/embed/vovkzbtYBC8",
  },
  "Among Us": {
    title: "Among Us",
    description:
      "A multiplayer social-deduction game where Crewmates complete tasks while Impostors try to eliminate them.",
    genre: "Social Deduction • Multiplayer",
    platforms: "PC • Mobile • Nintendo Switch • Xbox • PlayStation",
    releaseDate: "15 June 2018",
    developer: "Innersloth",
    publisher: "Innersloth",
    trailerUrl: "https://www.youtube.com/embed/NSJ4cESNQfE",
  },
  "Black Myth Wukong": {
    title: "Black Myth: Wukong",
    description:
      "An action RPG inspired by the classic Chinese novel Journey to the West, focused on combat and exploration.",
    genre: "Action RPG",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "20 August 2024",
    developer: "Game Science",
    publisher: "Game Science",
    trailerUrl: "https://www.youtube.com/embed/0Zw-mo0EFt0",
  },
  "Counter Strike 2": {
    title: "Counter-Strike 2",
    description:
      "A competitive tactical first-person shooter built around team-based objectives and precision gunplay.",
    genre: "Tactical FPS • Multiplayer",
    platforms: "PC",
    releaseDate: "27 September 2023",
    developer: "Valve",
    publisher: "Valve",
    trailerUrl: "https://www.youtube.com/embed/nSE38xjMLqE",
  },
  "Ghost of Tsushima": {
    title: "Ghost of Tsushima",
    description:
      "An open-world action adventure following Jin Sakai as he defends Tsushima during the Mongol invasion.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation",
    releaseDate: "17 July 2020",
    developer: "Sucker Punch Productions",
    publisher: "Sony Interactive Entertainment",
    trailerUrl: "https://www.youtube.com/embed/kSAvzeopPC8",
  },
  "GTA VI": {
    title: "Grand Theft Auto VI",
    description:
      "The next mainline Grand Theft Auto adventure returns to the modern state of Leonida and follows Jason and Lucia through a criminal conspiracy.",
    genre: "Action • Open World",
    platforms: "PlayStation 5 • Xbox Series X|S",
    releaseDate: "19 November 2026",
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    trailerUrl: "https://www.youtube.com/embed/VQRLujxTm3c",
  },
  "God of War Ragnarok": {
    title: "God of War Ragnarök",
    description:
      "An action-adventure journey following Kratos and Atreus through the Norse realms as Ragnarök approaches.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation",
    releaseDate: "9 November 2022",
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    trailerUrl: "https://www.youtube.com/embed/g1wr0DfV73E",
  },
  "God of War": {
    title: "God of War",
    description:
      "A third-person action-adventure game that follows Kratos and his son Atreus through the Norse wilds.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation",
    releaseDate: "20 April 2018",
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    trailerUrl: "https://www.youtube.com/embed/lRhzFqA1f7o",
  },
  "Hogwarts Legacy": {
    title: "Hogwarts Legacy",
    description:
      "An open-world action RPG set in the Wizarding World, letting players attend Hogwarts and explore its surrounding lands.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "10 February 2023",
    developer: "Avalanche Software",
    publisher: "Warner Bros. Games",
    trailerUrl: "https://www.youtube.com/embed/BtyBjOW8sGY",
  },
  Minecraft: {
    title: "Minecraft",
    description:
      "A sandbox game focused on exploration, building, crafting and survival in procedurally generated worlds.",
    genre: "Sandbox • Survival",
    platforms: "PC • Console • Mobile",
    releaseDate: "18 November 2011",
    developer: "Mojang Studios",
    publisher: "Mojang Studios",
    trailerUrl: "https://www.youtube.com/embed/Rla3FUlxJdE",
  },
};

/* =========================================================
   GAMINGVERSE AGE & SAFETY RULES
   Ratings below are GamingVerse's access categories.
========================================================= */
const gameAgeRatings = {
  "GTA V": "18+",
  "Cyberpunk 2077": "18+",
  "Assassin's Creed Shadows": "16+",
  "Among Us": "7+",
  "Black Myth Wukong": "16+",
  "Counter Strike 2": "16+",
  "Ghost of Tsushima": "16+",
  "GTA VI": "18+",
  "God of War Ragnarok": "16+",
  "God of War": "16+",
  "Hogwarts Legacy": "12+",
  Minecraft: "7+",
};

/* Games that must never be available through the normal game catalogue. */
const blockedGameNames = ["blue whale"];

/* =========================================================
   AUTOMATIC GAME CATALOGUE
   RAWG supplies live PC + PlayStation + Xbox game data.
   For this college/demo build the key is kept in this file.
   NOTE: a client-side API key is visible in the browser bundle.
========================================================= */
const RAWG_API_KEY = "96ce35c844ec40458f1b56cc62037d3c";

const RAWG_ALLOWED_PLATFORM_SLUGS = new Set([
  "pc",
  "playstation4",
  "playstation5",
  "xbox-one",
  "xbox-series-x",
  "xbox-series-s",
]);

const PRIORITY_GAME_NAMES = [
  "Assassin's Creed Shadows",
  "Among Us",
  "Black Myth: Wukong",
  "Counter-Strike 2",
  "Cyberpunk 2077",
  "Ghost of Tsushima",
  "Grand Theft Auto VI",
  "Grand Theft Auto V",
  "God of War Ragnarök",
  "God of War",
  "Hogwarts Legacy",
  "Minecraft",
  "Red Dead Redemption 2",
  "Red Dead Redemption",
  "The Witcher 3: Wild Hunt",
  "Elden Ring",
  "Elden Ring Nightreign",
  "Assassin's Creed Valhalla",
  "Assassin's Creed Odyssey",
  "Assassin's Creed Origins",
  "Far Cry 6",
  "Far Cry 5",
  "Watch Dogs 2",
  "Mafia III",
  "Sleeping Dogs",
  "Just Cause 4",
  "Marvel's Spider-Man Remastered",
  "Marvel's Spider-Man: Miles Morales",
  "Marvel's Spider-Man 2",
  "The Last of Us Part I",
  "The Last of Us Part II",
  "Uncharted 4: A Thief's End",
  "Tomb Raider",
  "Rise of the Tomb Raider",
  "Shadow of the Tomb Raider",
  "Sekiro: Shadows Die Twice",
  "Devil May Cry 5",
  "Star Wars Jedi: Fallen Order",
  "Star Wars Jedi: Survivor",
  "Resident Evil 4",
  "Resident Evil Village",
  "Resident Evil 2",
  "Silent Hill 2",
  "Dead Space",
  "Alan Wake 2",
  "Phasmophobia",
  "The Forest",
  "Sons of the Forest",
  "VALORANT",
  "Fortnite",
  "Call of Duty: Warzone",
  "Apex Legends",
  "Tom Clancy's Rainbow Six Siege",
  "PUBG: Battlegrounds",
  "Rocket League",
  "Overwatch 2",
  "Dota 2",
  "League of Legends",
  "Forza Horizon 5",
  "Need for Speed Heat",
  "Need for Speed Unbound",
  "EA Sports FC 26",
  "NBA 2K26",
  "EA Sports F1 25",
  "Terraria",
  "Stardew Valley",
  "Hollow Knight",
  "Hollow Knight: Silksong",
  "Hades",
  "Hades II",
  "Dead Cells",
  "Palworld",
  "Rust",
  "ARK: Survival Evolved",
  "Garry's Mod",
  "Left 4 Dead 2",
];

const normalizePriorityGameName = (value = "") =>
  String(value).toLowerCase().replace(/[:'’]/g, "").replace(/\s+/g, " ").trim();

const priorityGameRank = new Map(
  PRIORITY_GAME_NAMES.map((name, index) => [
    normalizePriorityGameName(name),
    index,
  ]),
);

// Prevent the automatic catalogue from repeating games that already
// exist in GamingVerse's curated catalogue, including the requested
// priority titles. This keeps the Home sections visually unique.
const CURATED_GAME_NAME_KEYS = new Set([
  ...horizontalGames.map((game) => normalizePriorityGameName(game.name)),
  ...posterGames.map((game) => normalizePriorityGameName(game.name)),
  ...PRIORITY_GAME_NAMES.map((name) => normalizePriorityGameName(name)),
]);

const automaticGameDetailsCache = {};

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

function rawgGameHasAllowedPlatform(game) {
  return (
    Array.isArray(game?.platforms) &&
    game.platforms.some((entry) =>
      RAWG_ALLOWED_PLATFORM_SLUGS.has(entry?.platform?.slug),
    )
  );
}

function rawgGameIsSafe(game) {
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

function mapRawgGame(game) {
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

function calculateAgeFromDob(dob) {
  if (!dob) return null;

  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? age : null;
}

function getRequiredGameAge(gameName) {
  const rating = gameAgeRatings[gameName] || "16+";
  return Number.parseInt(rating, 10) || 16;
}

function isBlockedGame(game) {
  const details = getGameDetails(game?.name || "");
  const text = [
    game?.name,
    details?.title,
    details?.description,
    details?.genre,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return blockedGameNames.some((blocked) => text.includes(blocked));
}

function canAccessGame(game, userAge) {
  if (!game || isBlockedGame(game)) return false;

  const requiredAge = getRequiredGameAge(game.name);

  /*
    No DOB = allow only games below 16.
    This prevents an unverified account from opening 16+/18+ titles.
  */
  if (userAge === null || userAge === undefined) {
    return requiredAge < 16;
  }

  return userAge >= requiredAge;
}

/* =========================================================
   GAMING CLUBS
   Client-side prototype data. Club membership, new clubs and
   discussions are saved in localStorage for this build.
========================================================= */
const DEFAULT_GAMING_CLUBS = [
  {
    id: "action-adventure",
    name: "Action & Adventure",
    interest: "Action",
    description:
      "Talk about open-world adventures, story campaigns and action games.",
    members: 128,
    accent: "#a832ff",
  },
  {
    id: "fps-arena",
    name: "FPS Arena",
    interest: "FPS",
    description:
      "Competitive FPS players, strategies, loadouts and match discussions.",
    members: 96,
    accent: "#b04cff",
  },
  {
    id: "rpg-world",
    name: "RPG World",
    interest: "RPG",
    description: "Builds, quests, characters, lore and everything RPG.",
    members: 84,
    accent: "#c15cff",
  },
  {
    id: "playstation-hub",
    name: "PlayStation Hub",
    interest: "PlayStation",
    description:
      "PS4 and PS5 gamers sharing releases, tips and co-op sessions.",
    members: 112,
    accent: "#8f2df0",
  },
  {
    id: "xbox-zone",
    name: "Xbox Zone",
    interest: "Xbox",
    description:
      "Xbox One and Xbox Series X|S gamers connecting and playing together.",
    members: 77,
    accent: "#9f3cff",
  },
  {
    id: "pc-gamers",
    name: "PC Gamers",
    interest: "PC",
    description:
      "PC gaming hardware, performance, builds and multiplayer sessions.",
    members: 143,
    accent: "#b43dff",
  },
];

const DEFAULT_CLUB_DISCUSSIONS = [
  {
    id: "club-discussion-1",
    clubId: "action-adventure",
    title: "What should I play after finishing Ghost of Tsushima?",
    author: "Gamer",
    meta: "2h ago • 12 replies",
  },
  {
    id: "club-discussion-2",
    clubId: "fps-arena",
    title: "Best competitive FPS settings for a smoother aim?",
    author: "ShadowX",
    meta: "5h ago • 8 replies",
  },
  {
    id: "club-discussion-3",
    clubId: "rpg-world",
    title: "Which RPG has the best world design?",
    author: "Arjun",
    meta: "Yesterday • 19 replies",
  },
];

const currentGamingNews = [
  {
    id: "konami-press-start",
    source: "KONAMI",
    time: "1 Sep 2026",
    tag: "SHOWCASE",
    title: "KONAMI Press Start returns Sept. 3 with new game updates",
    summary:
      "KONAMI says its Sept. 3 broadcast will feature Silent Hill: Townfall, Castlevania: Belmont’s Curse and the newly announced RPG Rev. NOiR.",
    url: "https://www.konami.com/games/eu/en/topics/19272/",
    imageGame: "Assassin's Creed Shadows",
  },
  {
    id: "playstation-state-of-play",
    source: "Game News Round-Up",
    time: "1 Sep 2026",
    tag: "PLAYSTATION",
    title: "PlayStation announces a new State of Play for Sept. 3",
    summary:
      "The upcoming showcase is scheduled for later this week, with an extended look at Final Fantasy VII Revelation and a Japan-focused presentation.",
    url: "https://gamenewsroundup.co.uk/",
    imageGame: "Ghost of Tsushima",
  },
  {
    id: "gta6-leonida",
    source: "GamingBolt",
    time: "1 Sep 2026",
    tag: "GTA VI",
    title: "GTA 6’s Leonida is so large developers have not seen all of it",
    summary:
      "Rockstar has highlighted the scale of Leonida, underscoring the ambition behind the open world of the upcoming sequel.",
    url: "https://gamingbolt.com/category/news",
    imageGame: "GTA VI",
  },
  {
    id: "onimusha-trailer",
    source: "GamingBolt",
    time: "1 Sep 2026",
    tag: "TRAILER",
    title: "Onimusha: Way of the Sword gets a new trailer",
    summary:
      "The new trailer introduces a dangerous Genma duo and offers more footage of the upcoming samurai action game.",
    url: "https://gamingbolt.com/category/news",
    imageGame: "Ghost of Tsushima",
  },
  {
    id: "mortal-shell-2",
    source: "GamingBolt",
    time: "1 Sep 2026",
    tag: "UPDATE",
    title: "Mortal Shell 2 receives its first major update",
    summary:
      "The first update brings improvements to exploration and adds new Beacons, items and other gameplay changes.",
    url: "https://gamingbolt.com/category/news",
    imageGame: "Black Myth Wukong",
  },
  {
    id: "pikmin-switch2",
    source: "VGC",
    time: "1 Sep 2026",
    tag: "NINTENDO",
    title: "Pikmin 3 Deluxe gets a free Switch 2 update",
    summary:
      "The update adds improved visuals and GameShare support to the Nintendo Switch 2 version.",
    url: "https://www.videogameschronicle.com/category/news/",
    imageGame: "Hogwarts Legacy",
  },
  {
    id: "xbox-layoffs",
    source: "The Guardian",
    time: "1 Sep 2026",
    tag: "INDUSTRY",
    title: "Xbox studios face further disruption after major layoffs",
    summary:
      "New reporting details the impact of Microsoft's gaming restructuring and widespread job cuts across the organisation.",
    url: "https://www.theguardian.com/games/2026/sep/01/xbox-layoffs-microsoft",
    imageGame: "Cyberpunk 2077",
  },
  {
    id: "star-wars-zero-company",
    source: "PocketGamer.biz",
    time: "1 Sep 2026",
    tag: "INDUSTRY",
    title: "Star Wars Zero Company studio reportedly furloughs most staff",
    summary:
      "Industry reporting says Bit Reactor has furloughed a large portion of its staff around the game's launch period.",
    url: "https://www.pocketgamer.biz/latest/",
    imageGame: "Counter Strike 2",
  },
];

const richGameDetails = {
  "Assassin's Creed Shadows": {
    about:
      "Assassin's Creed Shadows takes players into feudal Japan during a period of political conflict and social change. The game combines stealth, exploration and direct combat through two very different protagonists.",
    story:
      "The story follows Naoe, a skilled shinobi, and Yasuke, a powerful samurai. Their paths become connected as they confront enemies and uncover a larger struggle across Japan.",
    gameplay:
      "Players can switch between stealth-focused infiltration and direct samurai combat. Exploration, parkour, weapons and environmental opportunities all play a major role.",
    features: [
      "Two playable protagonists",
      "Open-world Japan",
      "Stealth gameplay",
      "Samurai combat",
      "Parkour and exploration",
      "Dynamic environments",
    ],
  },
  "GTA V": {
    about:
      "Grand Theft Auto V presents a huge open-world version of Los Santos and Blaine County. Players can move between three protagonists while exploring the city, countryside and a wide range of activities.",
    story:
      "Michael, Franklin and Trevor become connected through a series of criminal jobs, rivalries and increasingly dangerous heists.",
    gameplay:
      "Drive, shoot, explore, complete missions, customize vehicles and take part in side activities across the open world.",
    features: [
      "Three protagonists",
      "Open-world Los Santos",
      "Heist missions",
      "Vehicle customization",
      "GTA Online",
    ],
  },
  "Cyberpunk 2077": {
    about:
      "Cyberpunk 2077 is a futuristic open-world RPG set in Night City, a dense metropolis where corporations, gangs and mercenaries compete for power.",
    story:
      "V becomes involved in a dangerous mission involving a prototype digital construct that changes the direction of their life.",
    gameplay:
      "Players mix firearms, melee combat, stealth, hacking and cyberware while making choices that affect missions and relationships.",
    features: [
      "Night City open world",
      "Character customization",
      "Cyberware",
      "Multiple combat styles",
      "Branching choices",
    ],
  },
  "Among Us": {
    about:
      "Among Us is a social-deduction multiplayer game built around teamwork, deception and discussion. Crewmates work together while hidden Impostors try to eliminate them.",
    story:
      "Players are members of a crew completing tasks while trying to identify the Impostors before the crew is eliminated.",
    gameplay:
      "Complete tasks, report suspicious activity, discuss evidence and vote. Impostors sabotage the team and secretly remove players.",
    features: [
      "Social deduction",
      "Crewmate tasks",
      "Impostor sabotage",
      "Meetings and voting",
      "Online multiplayer",
    ],
  },
  "Black Myth Wukong": {
    about:
      "Black Myth: Wukong is an action RPG inspired by Journey to the West and Chinese mythology, combining cinematic presentation with demanding combat.",
    story:
      "Players take the role of the Destined One and travel through a mythological world filled with powerful creatures and mysterious characters.",
    gameplay:
      "Combat focuses on staff techniques, spells, transformations, dodging and learning enemy patterns.",
    features: [
      "Mythological China",
      "Boss-focused combat",
      "Transformations",
      "Spells and abilities",
      "Detailed environments",
    ],
  },
  "Counter Strike 2": {
    about:
      "Counter-Strike 2 is a competitive tactical shooter where teams fight through objective-based rounds using economy management, precision aim and coordinated strategy.",
    story:
      "Matches revolve around Counter-Terrorist and Terrorist teams competing to complete objectives such as planting or defusing the bomb.",
    gameplay:
      "Players buy weapons and equipment each round, coordinate with teammates and use map knowledge, aim and timing to win engagements.",
    features: [
      "Competitive 5v5",
      "Round-based economy",
      "Tactical team play",
      "Competitive ranking",
      "Precise gunplay",
    ],
  },
  "Ghost of Tsushima": {
    about:
      "Ghost of Tsushima is an open-world samurai adventure set during the Mongol invasion of Tsushima. The game combines sword combat, stealth and exploration.",
    story:
      "Jin Sakai must adapt his traditional samurai values and learn new tactics while defending his home from the invading Mongol forces.",
    gameplay:
      "Explore the island, duel enemies, use stealth, discover upgrades and customize Jin's combat style.",
    features: [
      "Open-world Tsushima",
      "Samurai duels",
      "Stealth combat",
      "Photo mode",
      "Exploration and side stories",
    ],
  },
  "GTA VI": {
    about:
      "Grand Theft Auto VI returns players to Vice City and the wider state of Leonida. The game follows a new criminal partnership against a backdrop of crime, ambition and the modern American South.",
    story:
      "Jason and Lucia find themselves caught in a criminal conspiracy after a job goes wrong, forcing them to rely on each other to survive.",
    gameplay:
      "Explore a large open world, complete missions, drive vehicles, interact with characters and build your criminal reputation.",
    features: [
      "Vice City",
      "Jason and Lucia",
      "Open-world exploration",
      "Vehicles and activities",
      "Story-driven missions",
    ],
  },
  "God of War Ragnarok": {
    about:
      "God of War Ragnarök continues Kratos and Atreus' journey through the Norse realms as they confront powerful gods and the events surrounding Ragnarök.",
    story:
      "Kratos and Atreus search for answers while trying to prevent a future shaped by prophecy, conflict and the Norse gods.",
    gameplay:
      "Use the Leviathan Axe, Blades of Chaos and new abilities while exploring realms, solving puzzles and fighting enemies.",
    features: [
      "Norse mythology",
      "Kratos and Atreus",
      "Cinematic story",
      "Realm exploration",
      "Upgradable combat",
    ],
  },
  "God of War": {
    about:
      "God of War reimagines Kratos' journey in the Norse world and focuses strongly on his relationship with his son Atreus.",
    story:
      "After the death of Atreus' mother, Kratos and his son begin a journey to fulfill her final wish while facing dangers from the Norse gods.",
    gameplay:
      "Explore the Norse wilderness, fight enemies, solve environmental puzzles and upgrade weapons and abilities.",
    features: [
      "Norse setting",
      "Kratos and Atreus",
      "Leviathan Axe",
      "Story-driven adventure",
      "Exploration and puzzles",
    ],
  },
  "Hogwarts Legacy": {
    about:
      "Hogwarts Legacy lets players experience life as a student at Hogwarts while exploring a large portion of the Wizarding World outside the castle.",
    story:
      "A young witch or wizard discovers an unusual connection to ancient magic and becomes involved in a conflict that threatens the Wizarding World.",
    gameplay:
      "Attend classes, learn spells, brew potions, battle enemies, customize gear and explore Hogwarts and surrounding locations.",
    features: [
      "Hogwarts exploration",
      "Spell-based combat",
      "Character customization",
      "Magical creatures",
      "Open-world exploration",
    ],
  },
  Minecraft: {
    about:
      "Minecraft is a sandbox game where players can create structures, explore generated worlds, gather resources and build their own adventures.",
    story:
      "Minecraft has no fixed story campaign; players create their own goals through survival, exploration, construction and discovery.",
    gameplay:
      "Mine resources, craft tools, build structures, farm, explore caves and fight hostile creatures. Creative mode allows unrestricted building.",
    features: [
      "Sandbox building",
      "Survival mode",
      "Creative mode",
      "Crafting system",
      "Multiplayer worlds",
    ],
  },
};
function getGameDetails(gameName) {
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
/* =========================================================
   GAMES PAGE
========================================================= */

function GVIcon({ name, size = 21 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 5-4.8 2.2 2.2-4.8 5-2.4Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2.2" />
        <path d="M16 2.8v3.6M8 2.8v3.6M3 9h18" />
      </>
    ),
    spaces: (
      <>
        <path d="M7 6h10v8H7z" />
        <path d="M9 14v3M15 14v3M6 17h12" />
        <path d="M9 4V2M15 4V2" />
      </>
    ),
    bookmark: (
      <>
        <path d="M6 3.5h12v17l-6-3.7-6 3.7z" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 8H7" />
        <circle cx="10" cy="19" r="1.4" />
        <circle cx="18" cy="19" r="1.4" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    bell: (
      <>
        <path d="M6.5 10.5a5.5 5.5 0 1 1 11 0c0 5 2 5.5 2 7H4.5c0-1.5 2-2 2-7Z" />
        <path d="M10 20h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.2" />
        <path d="m15.5 15.5 4.2 4.2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.8-3.4 3-5.2 6.5-5.2s5.7 1.8 6.5 5.2" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function normalizeLibraryGameName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/['’:!.,-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatActivityDate(timestamp) {
  const diff = Math.max(0, Date.now() - Number(timestamp || 0));
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function Games() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState("home");
  const [showAllAutomaticGames, setShowAllAutomaticGames] = useState(false);
  const [showAllFeaturedGames, setShowAllFeaturedGames] = useState(false);
  const [showAllCatalogueGames, setShowAllCatalogueGames] = useState(false);
  const [activityFilter, setActivityFilter] = useState("All");
  const [activitySort, setActivitySort] = useState("Recent");
  const [activityType, setActivityType] = useState("All");
  const [activityReviews, setActivityReviews] = useState([]);
  const [top100Filter, setTop100Filter] = useState("All");
  const [top100Sort, setTop100Sort] = useState("Game");
  const [gamingVerseRatings, setGamingVerseRatings] = useState({});
  const [discoverSort, setDiscoverSort] = useState("Newest Releases");
  const [discoverPlatform, setDiscoverPlatform] = useState("All Platforms");
  const [discoverGenre, setDiscoverGenre] = useState("All Genres");
  const [discoverRelease, setDiscoverRelease] = useState("All Releases");
  const [discoverPreset, setDiscoverPreset] = useState("");

  useEffect(() => {
    const view = searchParams.get("view");
    setActiveView(
      view === "collections"
        ? "home"
        : view === "following"
          ? "following"
          : view === "top100"
            ? "top100"
            : view === "spaces"
              ? "trailers"
              : view === "clubs"
                ? "clubs"
                : "home",
    );
    if (view === "clubs") {
      setSpacesSection("clubs");
    } else if (view === "spaces") {
      setSpacesSection("feed");
    }
  }, [searchParams]);

  // Discover has its own game-focused landing/filter page.
  useEffect(() => {
    if (searchParams.get("view") === "discover") {
      setActiveView("discover");
      setSearch("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  // A browser reload always starts GamingVerse on the Home page.
  useEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    if (navigationEntry?.type === "reload") {
      const reloadView = searchParams.get("view");
      if (reloadView === "clubs") {
        setActiveView("clubs");
        setSpacesSection("clubs");
      } else if (reloadView === "spaces") {
        setActiveView("trailers");
        setSpacesSection("feed");
      } else {
        setActiveView("home");
        setActiveCategory("All");
        if (reloadView) {
          navigate("/games", { replace: true });
        }
      }
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const [heroIndex, setHeroIndex] = useState(0);
  const [spacesSection, setSpacesSection] = useState("feed");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDiscoverMenu, setShowDiscoverMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_notifications") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const addGamingVerseNotification = (title, message, type = "activity") => {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      type,
      createdAt: Date.now(),
      read: false,
    };
    setNotifications((current) => {
      const next = [notification, ...current].slice(0, 100);
      localStorage.setItem("gamingverse_notifications", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const loadNotifications = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("gamingverse_notifications") || "[]",
        );
        setNotifications(Array.isArray(saved) ? saved : []);
      } catch {
        setNotifications([]);
      }
    };
    loadNotifications();
    const handleNotificationUpdate = () => loadNotifications();
    window.addEventListener(
      "gamingverse-notification",
      handleNotificationUpdate,
    );
    window.addEventListener("storage", handleNotificationUpdate);
    return () => {
      window.removeEventListener(
        "gamingverse-notification",
        handleNotificationUpdate,
      );
      window.removeEventListener("storage", handleNotificationUpdate);
    };
  }, []);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const trailerSessionRef = useRef(0);
  const showTrailerRef = useRef(false);
  const [watchedGames, setWatchedGames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gamingverse_watched") || "[]");
    } catch {
      return [];
    }
  });
  const [collectionGames, setCollectionGames] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("gamingverse_collections") || "[]",
      );
    } catch {
      return [];
    }
  });
  const [watchLaterGames, setWatchLaterGames] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("gamingverse_watch_later") || "[]",
      );
    } catch {
      return [];
    }
  });
  const [reviewCounts, setReviewCounts] = useState(emptyCounts);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [composerVerdict, setComposerVerdict] = useState("timepass");
  const [reviewFilter, setReviewFilter] = useState("Most Liked");
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [communityReviews, setCommunityReviews] = useState([]);
  const [likedReviewIds, setLikedReviewIds] = useState([]);
  const [gameComments, setGameComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const [ageLoading, setAgeLoading] = useState(true);
  const [automaticGames, setAutomaticGames] = useState([]);
  const [automaticGamesLoading, setAutomaticGamesLoading] = useState(true);
  const [automaticGamesError, setAutomaticGamesError] = useState("");
  const [catalogueImageMap, setCatalogueImageMap] = useState({});
  const [trailerMediaMap, setTrailerMediaMap] = useState({});
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [upcomingGamesLoading, setUpcomingGamesLoading] = useState(true);
  const [upcomingGamesError, setUpcomingGamesError] = useState("");
  const [gamingClubs, setGamingClubs] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_clubs") || "null",
      );
      return Array.isArray(saved) && saved.length
        ? saved
        : DEFAULT_GAMING_CLUBS;
    } catch {
      return DEFAULT_GAMING_CLUBS;
    }
  });
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [joinedClubIds, setJoinedClubIds] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_joined_clubs") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [clubInterest, setClubInterest] = useState("All");
  const [clubSearch, setClubSearch] = useState("");
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubInterest, setNewClubInterest] = useState("Action");
  const [newClubDescription, setNewClubDescription] = useState("");
  const [clubPost, setClubPost] = useState("");
  const [communityTalkPost, setCommunityTalkPost] = useState("");
  const [communityTalks, setCommunityTalks] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_community_talks") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [clubDiscussions, setClubDiscussions] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_club_discussions") || "null",
      );
      return Array.isArray(saved) ? saved : DEFAULT_CLUB_DISCUSSIONS;
    } catch {
      return DEFAULT_CLUB_DISCUSSIONS;
    }
  });

  /* =======================================================
       LOAD USER AGE FROM FIREBASE
  ======================================================= */
  useEffect(() => {
    if (!auth.currentUser) {
      setUserAge(null);
      setAgeLoading(false);
      return undefined;
    }

    const userRef = ref(db, `users/${auth.currentUser.uid}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const calculatedAge = calculateAgeFromDob(data.dob);

      setUserAge(
        calculatedAge !== null
          ? calculatedAge
          : Number.isFinite(Number(data.age))
            ? Number(data.age)
            : null,
      );
      setAgeLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  /* =======================================================
       FOLLOWING ACTIVITY
       Reads the existing community-review storage so the
       Following Activity view uses real GamingVerse reviews.
  ======================================================= */
  useEffect(() => {
    if (activeView !== "following") return undefined;

    const loadActivity = () => {
      const reviews = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key?.startsWith("gamingverse_community_reviews_")) continue;

        const gameId = key.replace("gamingverse_community_reviews_", "");
        try {
          const saved = JSON.parse(localStorage.getItem(key) || "[]");
          if (!Array.isArray(saved)) continue;
          saved.forEach((review) => {
            if (!review?.text) return;
            reviews.push({
              ...review,
              gameId,
              gameName: review.gameName || gameId,
              gameImage: review.gameImage || "",
            });
          });
        } catch (error) {
          console.error("Could not load following activity:", error);
        }
      }

      reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setActivityReviews(reviews);
    };

    loadActivity();
    window.addEventListener("storage", loadActivity);
    return () => window.removeEventListener("storage", loadActivity);
  }, [activeView]);

  /* =======================================================
       AUTOMATIC GAME CATALOGUE + UPCOMING GAMES
       Fetches the full PC / PlayStation / Xbox catalogue and
       a separate future-release catalogue from RAWG.
     ======================================================= */
  useEffect(() => {
    let cancelled = false;

    const fetchAutomaticGames = async () => {
      if (!RAWG_API_KEY || RAWG_API_KEY === "PASTE_RAWG_API_KEY_HERE") {
        setAutomaticGames([]);
        setUpcomingGames([]);
        setAutomaticGamesLoading(false);
        setUpcomingGamesLoading(false);
        setAutomaticGamesError(
          "Add your RAWG API key in Games.jsx to enable automatic games.",
        );
        setUpcomingGamesError(
          "Add your RAWG API key in Games.jsx to enable upcoming games.",
        );
        return;
      }

      try {
        setAutomaticGamesLoading(true);
        setUpcomingGamesLoading(true);
        setAutomaticGamesError("");
        setUpcomingGamesError("");

        /* Full catalogue: old + recent + current PC/PlayStation/Xbox games. */
        const TARGET_GAMES = 600;
        const PAGE_SIZE = 40;
        const MAX_PAGES = 45;
        const catalogueToday = new Date().toISOString().slice(0, 10);
        const seen = new Set();
        const allResults = [];
        const discoveredCatalogueImages = {};

        for (
          let page = 1;
          page <= MAX_PAGES && allResults.length < TARGET_GAMES;
          page += 1
        ) {
          const endpoint =
            `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_API_KEY)}` +
            `&ordering=-rating` +
            `&page_size=${PAGE_SIZE}` +
            `&page=${page}`;

          const response = await fetch(endpoint, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(
              `Automatic games request failed (${response.status}) on page ${page}`,
            );
          }

          const data = await response.json();
          const pageResults = Array.isArray(data?.results) ? data.results : [];

          if (!pageResults.length) break;

          // Keep RAWG images for ALL valid games, including games that are
          // already in the GamingVerse curated catalogue. These images are
          // used to fill poster cards that do not have a local image.
          pageResults.forEach((rawGame) => {
            if (rawGame?.name && rawGame?.background_image) {
              const imageKey = normalizeCatalogueImageKey(rawGame.name);
              if (imageKey && !discoveredCatalogueImages[imageKey]) {
                discoveredCatalogueImages[imageKey] = rawGame.background_image;
              }
            }
          });

          pageResults
            .filter((game) => game?.name && game?.background_image)
            .filter(
              (game) => !game?.released || game.released <= catalogueToday,
            )
            .filter(rawgGameHasAllowedPlatform)
            .filter(rawgGameIsSafe)
            .map(mapRawgGame)
            .filter((game) => {
              const key = normalizePriorityGameName(game.name);

              // Skip anything already present in the curated local catalogue.
              if (!key || CURATED_GAME_NAME_KEYS.has(key) || seen.has(key)) {
                return false;
              }

              seen.add(key);
              return true;
            })
            .filter((game) => !isBlockedGame(game))
            .forEach((game) => allResults.push(game));

          if (pageResults.length < PAGE_SIZE) break;
        }

        const mapped = allResults.sort((a, b) => {
          const aRank = priorityGameRank.get(normalizePriorityGameName(a.name));
          const bRank = priorityGameRank.get(normalizePriorityGameName(b.name));
          const aHasRank = Number.isInteger(aRank);
          const bHasRank = Number.isInteger(bRank);

          if (aHasRank && bHasRank) return aRank - bRank;
          if (aHasRank) return -1;
          if (bHasRank) return 1;
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        });

        mapped.forEach((game) => {
          automaticGameDetailsCache[game.name] = {
            title: game.name,
            description: `Automatically added to GamingVerse from the live game catalogue. Discover ${game.name}, its platforms, release information and community verdict.`,
            genre: game.genre,
            platforms: game.platforms,
            releaseDate: game.releaseDate || "—",
            developer: game.developer || "—",
            publisher: game.publisher || "—",
            trailerUrl: game.trailerUrl || "",
          };
          gameAgeRatings[game.name] = game.ageRating;
        });

        if (!cancelled) {
          setCatalogueImageMap((prev) => ({
            ...prev,
            ...discoveredCatalogueImages,
          }));
          setAutomaticGames(mapped);
        }

        /* Future releases only: today through the next 2 years. */
        const today = new Date();
        const todayValue = today.toISOString().slice(0, 10);
        const futureDate = new Date(today);
        futureDate.setFullYear(futureDate.getFullYear() + 2);
        const futureDateValue = futureDate.toISOString().slice(0, 10);

        const upcomingSeen = new Set();
        const upcomingResults = [];

        for (
          let page = 1;
          page <= 5 && upcomingResults.length < 120;
          page += 1
        ) {
          const upcomingEndpoint =
            `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_API_KEY)}` +
            `&dates=${todayValue},${futureDateValue}` +
            `&ordering=released` +
            `&page_size=${PAGE_SIZE}` +
            `&page=${page}`;

          const upcomingResponse = await fetch(upcomingEndpoint, {
            method: "GET",
            cache: "no-store",
          });

          if (!upcomingResponse.ok) {
            throw new Error(
              `Upcoming games request failed (${upcomingResponse.status}) on page ${page}`,
            );
          }

          const upcomingData = await upcomingResponse.json();
          const pageResults = Array.isArray(upcomingData?.results)
            ? upcomingData.results
            : [];

          if (!pageResults.length) break;

          pageResults
            .filter(
              (game) =>
                game?.name &&
                game?.background_image &&
                game?.released &&
                game.released > todayValue,
            )
            .filter(rawgGameHasAllowedPlatform)
            .filter(rawgGameIsSafe)
            .map(mapRawgGame)
            .filter((game) => {
              const key = game.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();

              if (!key || upcomingSeen.has(key)) return false;
              upcomingSeen.add(key);
              return true;
            })
            .filter((game) => !isBlockedGame(game))
            .forEach((game) => upcomingResults.push(game));

          if (pageResults.length < PAGE_SIZE) break;
        }

        const sortedUpcoming = upcomingResults.sort((a, b) =>
          String(a.releaseDate || "").localeCompare(
            String(b.releaseDate || ""),
          ),
        );

        sortedUpcoming.forEach((game) => {
          automaticGameDetailsCache[game.name] = {
            title: game.name,
            description: `Upcoming game in the GamingVerse release catalogue. Discover ${game.name}, its planned release date, platforms and community information.`,
            genre: game.genre,
            platforms: game.platforms,
            releaseDate: game.releaseDate || "TBA",
            developer: game.developer || "—",
            publisher: game.publisher || "—",
            trailerUrl: game.trailerUrl || "",
          };
          gameAgeRatings[game.name] = game.ageRating;
        });

        if (!cancelled) {
          setUpcomingGames(sortedUpcoming);
        }
      } catch (error) {
        console.error("Automatic/upcoming games error:", error);
        if (!cancelled) {
          setAutomaticGamesError(
            "Automatic game refresh failed. Your saved GamingVerse games are still available.",
          );
          setUpcomingGamesError(
            "Upcoming games could not be loaded right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setAutomaticGamesLoading(false);
          setUpcomingGamesLoading(false);
        }
      }
    };

    fetchAutomaticGames();

    const interval = window.setInterval(fetchAutomaticGames, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  /* =======================================================
       LIVE GAMING NEWS
       Uses Google News RSS through rss2json.
       No API key is required in the React app.
    ======================================================= */
  const [liveNews, setLiveNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState(null);
  const [newsError, setNewsError] = useState("");

  const cleanNewsText = (value = "") =>
    String(value)
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

  const fetchLiveGamingNews = async () => {
    try {
      setNewsLoading(true);
      setNewsError("");

      const googleNewsRss =
        "https://news.google.com/rss/search?q=gaming+OR+videogames+OR+PlayStation+OR+Xbox+OR+Nintendo+OR+PC+gaming+when%3A1d&hl=en-IN&gl=IN&ceid=IN:en";

      const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleNewsRss)}`;

      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Live news request failed (${response.status})`);
      }

      const data = await response.json();

      if (data.status !== "ok" || !Array.isArray(data.items)) {
        throw new Error(data.message || "Live news feed returned no items.");
      }

      const articles = data.items
        .filter((item) => item?.title && item?.link)
        .slice(0, 8)
        .map((item, index) => {
          const rawTitle = cleanNewsText(item.title);
          const titleParts = rawTitle.split(" - ");
          const source =
            item.author?.trim() ||
            (titleParts.length > 1
              ? titleParts[titleParts.length - 1]
              : "Gaming News");

          const title =
            titleParts.length > 1
              ? titleParts.slice(0, -1).join(" - ")
              : rawTitle;

          return {
            id: `live-${item.guid || item.link || index}`,
            source,
            time: item.pubDate
              ? new Date(item.pubDate).toLocaleString([], {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently",
            tag: "LIVE",
            title,
            summary:
              cleanNewsText(item.description || item.content) ||
              "Latest gaming news and industry updates.",
            url: item.link,
            image:
              item.thumbnail ||
              item.enclosure?.thumbnail ||
              item.enclosure?.link ||
              "",
            imageGame: "",
          };
        });

      if (!articles.length) {
        throw new Error("No gaming stories found in the live feed.");
      }

      setLiveNews(articles);
      setNewsUpdatedAt(new Date());
      setNewsError("");
    } catch (error) {
      console.error("Live gaming news error:", error);
      setNewsError("Live refresh failed. Showing saved news.");
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveGamingNews();

    const interval = window.setInterval(fetchLiveGamingNews, 10 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  const newsItems = liveNews.length ? liveNews : currentGamingNews;
  const openClub = (clubId) => {
    setSelectedClubId(clubId);
    setShowCreateClub(false);
    setClubPost("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleClubMembership = (clubId) => {
    setJoinedClubIds((current) => {
      const alreadyJoined = current.includes(clubId);
      // The card's Joined button is an OPEN action. Leaving a club is only
      // possible from inside the opened club, so it can never close by accident.
      if (alreadyJoined) {
        openClub(clubId);
        return current;
      }

      const next = [...current, clubId];
      localStorage.setItem("gamingverse_joined_clubs", JSON.stringify(next));
      openClub(clubId);
      return next;
    });
  };

  const closeClub = () => {
    setSelectedClubId(null);
  };

  const createGamingClub = () => {
    const name = newClubName.trim();
    const description =
      newClubDescription.trim() ||
      `A GamingVerse community for ${newClubInterest} gamers.`;

    if (!name) {
      return;
    }

    const club = {
      id: `club-${Date.now()}`,
      name,
      interest: newClubInterest,
      description,
      members: 1,
      accent: "#b04cff",
    };

    setGamingClubs((current) => {
      const next = [club, ...current];
      localStorage.setItem("gamingverse_clubs", JSON.stringify(next));
      return next;
    });

    setJoinedClubIds((current) => {
      const next = [...current, club.id];
      localStorage.setItem("gamingverse_joined_clubs", JSON.stringify(next));
      return next;
    });
    setSelectedClubId(club.id);

    setNewClubName("");
    setNewClubInterest("Action");
    setNewClubDescription("");
    setShowCreateClub(false);
  };

  const postClubDiscussion = () => {
    const text = clubPost.trim();
    if (!text) return;

    const discussion = {
      id: `club-discussion-${Date.now()}`,
      clubId: selectedClubId || joinedClubIds[0] || "action-adventure",
      title: text,
      author:
        auth.currentUser?.displayName ||
        auth.currentUser?.email?.split("@")[0] ||
        "Gamer",
      meta: "Just now • 0 replies",
    };

    setClubDiscussions((current) => {
      const next = [discussion, ...current];
      localStorage.setItem(
        "gamingverse_club_discussions",
        JSON.stringify(next),
      );
      return next;
    });
    setClubPost("");
  };

  const postCommunityTalk = () => {
    const text = communityTalkPost.trim();
    if (!text) return;

    const talk = {
      id: `community-talk-${Date.now()}`,
      title: text,
      author:
        auth.currentUser?.displayName ||
        auth.currentUser?.email?.split("@")[0] ||
        "Gamer",
      meta: "Just now • 0 replies",
    };

    setCommunityTalks((current) => {
      const next = [talk, ...current];
      localStorage.setItem("gamingverse_community_talks", JSON.stringify(next));
      return next;
    });
    setCommunityTalkPost("");
  };

  const filteredGamingClubs = useMemo(() => {
    const query = clubSearch.trim().toLowerCase();

    return gamingClubs.filter((club) => {
      const matchesInterest =
        clubInterest === "All" || club.interest === clubInterest;
      const matchesSearch =
        !query ||
        club.name.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query);
      return matchesInterest && matchesSearch;
    });
  }, [gamingClubs, clubInterest, clubSearch]);

  /* =======================================================
       LOAD GAME COMMENTS LIVE
    ======================================================= */
  useEffect(() => {
    if (!selectedGame) {
      setGameComments([]);
      setCommentText("");
      return undefined;
    }

    const commentsRef = ref(
      db,
      `gameComments/${createGameId(selectedGame.name)}`,
    );
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const comments = Object.entries(data)
        .map(([id, comment]) => ({ id, ...comment }))
        .filter((comment) => comment && comment.text)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setGameComments(comments);
    });

    return () => unsubscribe();
  }, [selectedGame]);

  const submitComment = async () => {
    const cleanComment = commentText.trim();
    if (!selectedGame || !cleanComment) {
      setReviewMessage("Write a comment before posting.");
      return;
    }
    if (!auth.currentUser) {
      setReviewMessage("Please login first to comment.");
      return;
    }

    try {
      setCommentLoading(true);
      const commentsRef = ref(
        db,
        `gameComments/${createGameId(selectedGame.name)}`,
      );
      const newCommentRef = push(commentsRef);
      await set(newCommentRef, {
        text: cleanComment,
        userId: auth.currentUser.uid,
        username:
          auth.currentUser.displayName ||
          auth.currentUser.email?.split("@")[0] ||
          "Gamer",
        userPhoto: auth.currentUser.photoURL || "",
        createdAt: Date.now(),
      });
      setCommentText("");
      setReviewMessage("✓ Comment posted.");
    } catch (error) {
      console.error("Comment error:", error);
      setReviewMessage("Unable to post comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  /* =======================================================
       CLOSE PROFILE / NOTIFICATIONS ON OUTSIDE CLICK
    ======================================================= */
  useEffect(() => {
    const handleDocumentClick = (event) => {
      const target = event.target;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowDiscoverMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowDiscoverMenu(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  const getCatalogueImage = (game) => {
    if (game?.image) return game.image;

    const candidates = [
      game?.name,
      game?.databaseKey,
      game?.title,
      game?.name === "Counter-Strike 2" ? "Counter Strike 2" : "",
      game?.name === "Grand Theft Auto VI" ? "GTA VI" : "",
      game?.name === "Grand Theft Auto V" ? "GTA V" : "",
      game?.name === "Marvel's Spider-Man 2" ? "Spider-Man 2" : "",
      game?.name === "Marvel's Spider-Man: Miles Morales"
        ? "Spider-Man Miles Morales"
        : "",
      game?.name === "Marvel's Spider-Man Remastered"
        ? "Spider-Man Remastered"
        : "",
    ];

    for (const candidate of candidates) {
      const key = normalizeCatalogueImageKey(candidate || "");
      if (key && catalogueImageMap[key]) return catalogueImageMap[key];
    }

    return getBestLocalCatalogueImage(game);
  };

  const filteredPosters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return completeGameCatalogue
      .filter(
        (game) =>
          game.name.toLowerCase().includes(query) &&
          matchesHomeCategory(game, activeCategory),
      )
      .map((game) => ({
        ...game,
        image: getCatalogueImage(game),
      }));
  }, [search, activeCategory, catalogueImageMap]);

  // Resolve missing poster images from RAWG.
  // This runs only for games that still have no local image.
  useEffect(() => {
    if (automaticGamesLoading || !RAWG_API_KEY) return undefined;

    let cancelled = false;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const getSearchCandidates = (game) => {
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
    };

    const chooseBestRawgResult = (results, game) => {
      const wanted = normalizeCatalogueImageKey(game?.name || "");
      const safe = results.filter(
        (item) =>
          item?.name &&
          item?.background_image &&
          !containsBlockedGameTerm(item.name),
      );

      safe.sort((a, b) => {
        const aScore = localImageSimilarity(wanted, a.name);
        const bScore = localImageSimilarity(wanted, b.name);
        if (bScore !== aScore) return bScore - aScore;
        return (Number(b?.rating) || 0) - (Number(a?.rating) || 0);
      });

      return safe[0] || null;
    };

    const lookupGameImage = async (game) => {
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
    };

    const missingGames = completeGameCatalogue.filter((game) => {
      if (!game?.name) return false;
      if (getCatalogueImage(game)) return false;
      return true;
    });

    const runLookups = async () => {
      const foundImages = {};
      const batchSize = 3;

      for (let index = 0; index < missingGames.length; index += batchSize) {
        const batch = missingGames.slice(index, index + batchSize);
        const results = await Promise.all(
          batch.map((game) => lookupGameImage(game)),
        );

        results.forEach((result) => {
          if (result?.gameKey && result?.image) {
            foundImages[result.gameKey] = result.image;
          }
        });

        if (cancelled) return;
        await sleep(180);
      }

      if (!cancelled && Object.keys(foundImages).length) {
        setCatalogueImageMap((prev) => ({
          ...prev,
          ...foundImages,
        }));
      }
    };

    if (missingGames.length) runLookups();

    return () => {
      cancelled = true;
    };
  }, [automaticGamesLoading]);

  // Load a trailer media source for the game details page.
  // Prefer a RAWG playable clip, then use a verified YouTube trailer.
  useEffect(() => {
    if (!showDetails || !selectedGame?.name || !RAWG_API_KEY) return undefined;

    const gameName = String(selectedGame.name).trim();
    const key = normalizeTrailerGameName(gameName);
    if (trailerMediaMap[key]) return undefined;

    let cancelled = false;

    const candidates = [
      gameName,
      getGameDetails(gameName)?.title,
      selectedGame?.databaseKey,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    const uniqueCandidates = [...new Set(candidates)];
    const scoreResult = (result) => {
      const wanted = normalizeGameSearchText(gameName);
      const got = normalizeGameSearchText(result?.name || "");
      if (!wanted || !got) return 0;
      if (wanted === got) return 1000;
      if (got.includes(wanted) || wanted.includes(got)) return 500;
      return localImageSimilarity(wanted, got) * 100;
    };

    const loadTrailer = async () => {
      let best = null;

      try {
        for (const candidate of uniqueCandidates) {
          const endpoint =
            `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_API_KEY)}` +
            `&search=${encodeURIComponent(candidate)}&page_size=10&search_precise=true`;
          const response = await fetch(endpoint, { cache: "no-store" });
          if (!response.ok) continue;

          const data = await response.json();
          const results = Array.isArray(data?.results)
            ? data.results
                .filter(
                  (item) => item?.name && !containsBlockedGameTerm(item.name),
                )
                .sort((a, b) => scoreResult(b) - scoreResult(a))
            : [];

          if (results[0]) {
            best = results[0];
            break;
          }
        }

        let clipUrl =
          best?.clip?.clips?.["640"] ||
          best?.clip?.clips?.["320"] ||
          best?.clip?.clip ||
          "";
        let preview = best?.clip?.preview || selectedGame?.image || "";

        if (best?.id && !clipUrl) {
          const detailResponse = await fetch(
            `https://api.rawg.io/api/games/${best.id}?key=${encodeURIComponent(RAWG_API_KEY)}`,
            { cache: "no-store" },
          );

          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            clipUrl =
              detail?.clip?.clips?.["640"] ||
              detail?.clip?.clips?.["320"] ||
              detail?.clip?.clip ||
              "";
            preview = detail?.clip?.preview || preview;
          }
        }

        if (cancelled) return;

        const verifiedYoutube = getVerifiedTrailerUrl(gameName);
        const details = getGameDetails(gameName);
        const rawgImage = best?.background_image || "";
        const youtubePreview = verifiedYoutube
          ? `https://i.ytimg.com/vi/${extractYouTubeId(verifiedYoutube)}/hqdefault.jpg`
          : "";

        setSelectedGame((current) => {
          if (!current || normalizeTrailerGameName(current.name) !== key)
            return current;

          const mediaFallback = getGameMediaFallback(gameName) || {};
          return {
            ...current,
            image:
              getBestLocalImage(current, posterGames) ||
              catalogueImageMap[normalizeCatalogueImageKey(gameName)] ||
              current.image ||
              rawgImage ||
              mediaFallback.poster ||
              youtubePreview,
            heroImage:
              getBestLocalImage(current, horizontalGames) ||
              current.heroImage ||
              rawgImage ||
              mediaFallback.hero ||
              current.image ||
              youtubePreview,
            trailerUrl:
              clipUrl ||
              verifiedYoutube ||
              current.trailerUrl ||
              mediaFallback.trailer ||
              "",
            trailerType: clipUrl
              ? "video"
              : verifiedYoutube
                ? "youtube"
                : current.trailerType || "search",
          };
        });

        setTrailerMediaMap((current) => ({
          ...current,
          [key]: {
            type: clipUrl ? "video" : verifiedYoutube ? "youtube" : "search",
            url: clipUrl || verifiedYoutube || "",
            preview,
            searchUrl:
              details?.trailerSearchUrl ||
              `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details?.title || gameName} official trailer`)}`,
          },
        }));
      } catch (error) {
        if (cancelled) return;

        const details = getGameDetails(gameName);
        const verifiedYoutube = getVerifiedTrailerUrl(gameName);
        const youtubePreview = verifiedYoutube
          ? `https://i.ytimg.com/vi/${extractYouTubeId(verifiedYoutube)}/hqdefault.jpg`
          : "";
        const mediaFallback = getGameMediaFallback(gameName) || {};

        setSelectedGame((current) => {
          if (!current || normalizeTrailerGameName(current.name) !== key)
            return current;
          return {
            ...current,
            image: current.image || mediaFallback.poster || youtubePreview,
            heroImage:
              current.heroImage ||
              mediaFallback.hero ||
              youtubePreview ||
              current.image ||
              "",
            trailerUrl:
              verifiedYoutube ||
              mediaFallback.trailer ||
              current.trailerUrl ||
              "",
            trailerType:
              verifiedYoutube || mediaFallback.trailer
                ? "youtube"
                : current.trailerType || "search",
          };
        });

        setTrailerMediaMap((current) => ({
          ...current,
          [key]: {
            type: getVerifiedTrailerUrl(gameName) ? "youtube" : "search",
            url: getVerifiedTrailerUrl(gameName),
            preview: selectedGame?.image || "",
            searchUrl:
              details?.trailerSearchUrl ||
              `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details?.title || gameName} official trailer`)}`,
          },
        }));
      }
    };

    loadTrailer();

    return () => {
      cancelled = true;
    };
  }, [showDetails, selectedGame?.name]);

  const filteredHorizontal = useMemo(() => {
    const query = search.trim().toLowerCase();
    return horizontalGames.filter(
      (game) =>
        game.name.toLowerCase().includes(query) &&
        matchesHomeCategory(game, activeCategory),
    );
  }, [search, activeCategory]);

  const filteredAutomaticGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return automaticGames.filter(
      (game) =>
        game.name.toLowerCase().includes(query) &&
        matchesHomeCategory(game, activeCategory) &&
        !containsBlockedGameTerm(game.name),
    );
  }, [automaticGames, search, activeCategory]);

  const visibleAutomaticGames = useMemo(() => {
    return showAllAutomaticGames
      ? filteredAutomaticGames
      : filteredAutomaticGames.slice(0, 24);
  }, [filteredAutomaticGames, showAllAutomaticGames]);

  const filteredUpcomingGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return upcomingGames.filter(
      (game) =>
        game.name.toLowerCase().includes(query) &&
        matchesHomeCategory(game, activeCategory) &&
        !containsBlockedGameTerm(game.name) &&
        game.releaseDate &&
        game.releaseDate > new Date().toISOString().slice(0, 10),
    );
  }, [upcomingGames, search, activeCategory]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const combined = [...automaticGames, ...completeGameCatalogue];
    const seen = new Set();

    return combined.filter((game) => {
      const key = game.name.toLowerCase();

      if (seen.has(key) || !key.includes(query)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [search, automaticGames]);

  const heroGames = useMemo(() => {
    const preferred = [
      "Assassin's Creed Shadows",
      "GTA V",
      "Cyberpunk 2077",
      "Black Myth Wukong",
      "Ghost of Tsushima",
      "GTA VI",
    ];
    const selected = preferred
      .map((name) =>
        horizontalGames.find(
          (game) => game.name.toLowerCase() === name.toLowerCase(),
        ),
      )
      .filter(Boolean);
    const used = new Set(selected.map((game) => game.name));
    for (const game of horizontalGames) {
      if (selected.length >= 6) break;
      if (!used.has(game.name)) {
        selected.push(game);
        used.add(game.name);
      }
    }
    return selected.slice(0, 6);
  }, []);
  useEffect(() => {
    if (heroGames.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroGames.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroGames.length]);
  useEffect(() => {
    setHeroIndex(0);
  }, [activeCategory, search]);
  /* =======================================================
       LOAD GAME REVIEWS LIVE
    ======================================================= */
  useEffect(() => {
    if (!selectedGame) {
      setReviewCounts(emptyCounts);
      setSelectedReview(null);
      return undefined;
    }
    const gameId = createGameId(selectedGame.name);
    const reviewsRef = ref(db, `gameReviews/${gameId}`);
    const storedReviews = JSON.parse(
      localStorage.getItem(`gamingverse_community_reviews_${gameId}`) || "[]",
    );
    const storedLikes = JSON.parse(
      localStorage.getItem(`gamingverse_review_likes_${gameId}`) || "[]",
    );
    setCommunityReviews(Array.isArray(storedReviews) ? storedReviews : []);
    setLikedReviewIds(Array.isArray(storedLikes) ? storedLikes : []);
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const counts = {
        perfection: 0,
        "go-for-it": 0,
        timepass: 0,
        skip: 0,
      };
      let currentUserReview = null;
      Object.values(data).forEach((userReview) => {
        if (!userReview || !userReview.review) {
          return;
        }
        if (counts[userReview.review] !== undefined) {
          counts[userReview.review] += 1;
        }
        if (auth.currentUser && userReview.userId === auth.currentUser.uid) {
          currentUserReview = userReview.review;
        }
      });
      setReviewCounts(counts);
      setSelectedReview(currentUserReview);
    });
    return () => unsubscribe();
  }, [selectedGame]);
  const toggleSavedList = (listName, gameName, setList) => {
    setList((current) => {
      const next = current.includes(gameName)
        ? current.filter((name) => name !== gameName)
        : [...current, gameName];
      localStorage.setItem(listName, JSON.stringify(next));
      addGamingVerseNotification(
        next.includes(gameName) ? "GamingVerse" : "GamingVerse",
        `${gameName} ${next.includes(gameName) ? "was added to" : "was removed from"} ${
          listName === "gamingverse_watched"
            ? "Watched"
            : listName === "gamingverse_collections"
              ? "Collections"
              : "Play Later"
        }.`,
        "activity",
      );
      window.dispatchEvent(new Event("gamingverse-notification"));
      return next;
    });
  };
  const toggleWatched = () => {
    if (!selectedGame) return;
    toggleSavedList("gamingverse_watched", selectedGame.name, setWatchedGames);
  };
  const toggleCollection = () => {
    if (!selectedGame) return;
    toggleSavedList(
      "gamingverse_collections",
      selectedGame.name,
      setCollectionGames,
    );
  };
  const toggleWatchLater = () => {
    if (!selectedGame) return;
    toggleSavedList(
      "gamingverse_watch_later",
      selectedGame.name,
      setWatchLaterGames,
    );
  };
  /* =======================================================
       OPEN / CLOSE METER
    ======================================================= */
  const handleRestrictedGame = (game) => {
    const rating = gameAgeRatings[game?.name] || "16+";
    const requiredAge = getRequiredGameAge(game?.name);

    if (isBlockedGame(game)) {
      setReviewMessage(
        "This game is unavailable on GamingVerse because it has been blocked by the platform safety system.",
      );
      return;
    }

    if (userAge === null) {
      setReviewMessage(
        `Age verification required. Add your Date of Birth in Profile to access ${rating} games.`,
      );
      return;
    }

    setReviewMessage(
      `Age restricted: this game requires ${requiredAge}+. Your GamingVerse age is ${userAge}.`,
    );
  };

  const openMeter = (game) => {
    openDetails(game);
  };

  const openDetails = (game) => {
    if (!canAccessGame(game, userAge)) {
      handleRestrictedGame(game);
      return;
    }

    const media = resolveGameMedia(game);
    setSelectedGame({
      ...game,
      image: media.poster || game?.image || "",
      heroImage: media.hero || game?.heroImage || "",
      trailerUrl: media.trailer || game?.trailerUrl || "",
      trailerType: media.trailer ? "youtube" : game?.trailerType || "search",
    });
    setShowDetails(true);
    setReviewMessage("");
    setSelectedReview(null);
  };

  useEffect(() => {
    if (ageLoading) return;

    const requestedGameName = searchParams.get("openGame");
    if (!requestedGameName) return;

    const requestedKey = normalizeLibraryGameName(requestedGameName);
    const allGameSources = [
      ...horizontalGames,
      ...posterGames,
      ...automaticGames,
      ...upcomingGames,
    ];

    const targetGame =
      allGameSources.find(
        (game) => normalizeLibraryGameName(game?.name) === requestedKey,
      ) ||
      allGameSources.find((game) => {
        const candidateKey = normalizeLibraryGameName(game?.name);
        return (
          candidateKey.includes(requestedKey) ||
          requestedKey.includes(candidateKey)
        );
      });

    if (!targetGame) return;

    setActiveView("home");
    setActiveCategory("All");
    setSearch("");
    openDetails(targetGame);
    const returnQuery = new URLSearchParams();
    const returnTarget = searchParams.get("return");
    const returnTab = searchParams.get("tab");
    if (returnTarget) returnQuery.set("return", returnTarget);
    if (returnTab) returnQuery.set("tab", returnTab);

    const nextUrl = returnQuery.toString()
      ? `/games?${returnQuery.toString()}`
      : "/games";

    navigate(nextUrl, { replace: true });
  }, [ageLoading, automaticGames, upcomingGames, searchParams, navigate]);

  const closeDetails = () => {
    const returnToProfile = searchParams.get("return") === "profile";
    const profileTab =
      searchParams.get("tab") === "reviews" ? "reviews" : "collections";

    setShowDetails(false);
    setSelectedGame(null);
    setReviewMessage("");
    setSelectedReview(null);

    if (returnToProfile) {
      navigate(`/profile?tab=${profileTab}`, { replace: true });
    }
  };
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  };

  const openTrailer = async (game) => {
    if (!canAccessGame(game, userAge)) {
      handleRestrictedGame(game);
      return;
    }

    const trailerSession = ++trailerSessionRef.current;
    const gameName = String(game?.name || "").trim();
    const details = getGameDetails(gameName);
    const verifiedTrailer = getVerifiedTrailerUrl(gameName);
    const trailerSearchUrl =
      details?.trailerSearchUrl ||
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${details?.title || gameName || "Game"} official trailer`,
      )}`;

    // Always prefer a verified YouTube trailer. Do not allow a non-YouTube
    // game.trailerUrl value to break the embedded player.
    const gameTrailerUrl = String(game?.trailerUrl || "").trim();
    const knownYoutubeTrailer =
      verifiedTrailer ||
      details?.trailerUrl ||
      (extractYouTubeId(gameTrailerUrl) ? gameTrailerUrl : "");

    setSelectedGame({
      ...game,
      trailerUrl: knownYoutubeTrailer,
      trailerType: knownYoutubeTrailer ? "youtube" : "search",
      trailerSearchUrl,
      trailerPreview: game?.image || "",
      fallbackYoutubeTrailer: knownYoutubeTrailer,
    });
    setShowDetails(false);
    showTrailerRef.current = true;
    setShowTrailer(true);
    setTrailerLoading(false);
    setReviewMessage("");

    // Known trailers should open immediately. No RAWG request is needed.
    if (knownYoutubeTrailer) return;

    setTrailerLoading(true);

    if (!RAWG_API_KEY) {
      setTrailerLoading(false);
      return;
    }

    const normalizeTrailerQuery = (value = "") =>
      String(value)
        .replace(/^Marvel's\s+/i, "")
        .replace(/^Tom Clancy's\s+/i, "")
        .replace(/^EA Sports\s+/i, "")
        .replace(/^Grand Theft Auto\s+/i, "GTA ")
        .replace(/^Counter-Strike\s+/i, "Counter Strike ")
        .replace(/^Hollow Knight:\s*/i, "Hollow Knight ")
        .trim();

    const candidates = [
      gameName,
      details?.title,
      game?.databaseKey,
      normalizeTrailerQuery(gameName),
      normalizeTrailerQuery(details?.title || ""),
    ].filter(Boolean);

    const uniqueCandidates = [...new Set(candidates)];

    const scoreResult = (result) => {
      const wanted = normalizeGameSearchText(gameName);
      const got = normalizeGameSearchText(result?.name || "");
      if (!wanted || !got) return 0;
      if (wanted === got) return 1000;
      if (got.includes(wanted) || wanted.includes(got)) return 500;
      return localImageSimilarity(wanted, got) * 100;
    };

    try {
      let best = null;

      for (const candidate of uniqueCandidates) {
        const endpoint =
          `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_API_KEY)}` +
          `&search=${encodeURIComponent(candidate)}` +
          `&page_size=10` +
          `&search_precise=true`;

        const response = await fetchWithTimeout(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) continue;

        const data = await response.json();
        const results = Array.isArray(data?.results)
          ? data.results.filter(
              (item) => item?.name && !containsBlockedGameTerm(item.name),
            )
          : [];

        results.sort((a, b) => scoreResult(b) - scoreResult(a));

        if (results[0]) {
          best = results[0];
          break;
        }
      }

      if (
        best?.id &&
        !best?.clip?.clip &&
        !best?.clip?.clips?.["640"] &&
        !best?.clip?.clips?.["320"]
      ) {
        const detailResponse = await fetchWithTimeout(
          `https://api.rawg.io/api/games/${best.id}?key=${encodeURIComponent(
            RAWG_API_KEY,
          )}`,
          { method: "GET", cache: "no-store" },
        );

        if (detailResponse.ok) {
          best = await detailResponse.json();
        }
      }

      const clipUrl =
        best?.clip?.clips?.["640"] ||
        best?.clip?.clips?.["320"] ||
        best?.clip?.clip ||
        "";

      const clipPreview = best?.clip?.preview || game?.image || "";

      if (clipUrl) {
        if (
          trailerSession !== trailerSessionRef.current ||
          !showTrailerRef.current
        )
          return;
        setSelectedGame((current) => ({
          ...(current || game),
          trailerUrl: clipUrl,
          trailerType: "video",
          trailerPreview: clipPreview,
          trailerSearchUrl,
        }));
      } else if (best?.id) {
        try {
          const moviesResponse = await fetchWithTimeout(
            `https://api.rawg.io/api/games/${best.id}/movies?key=${encodeURIComponent(
              RAWG_API_KEY,
            )}`,
            { method: "GET", cache: "no-store" },
          );

          if (moviesResponse.ok) {
            const moviesData = await moviesResponse.json();
            const movies = Array.isArray(moviesData?.results)
              ? moviesData.results
              : [];
            const movie = movies.find((item) => {
              const data = item?.data || {};
              return (
                data?.max || data?.["640"] || data?.["480"] || data?.["320"]
              );
            });
            const rawMovieUrl =
              movie?.data?.max ||
              movie?.data?.["640"] ||
              movie?.data?.["480"] ||
              movie?.data?.["320"] ||
              "";

            if (
              /\.(mp4|webm)(\?|$)/i.test(rawMovieUrl) ||
              rawMovieUrl.includes("media.rawg.io")
            ) {
              if (
                trailerSession !== trailerSessionRef.current ||
                !showTrailerRef.current
              )
                return;
              setSelectedGame((current) => ({
                ...(current || game),
                trailerUrl: rawMovieUrl,
                trailerType: "video",
                trailerPreview: movie?.preview || game?.image || "",
                trailerSearchUrl,
              }));
              return;
            }

            const youtubeId = extractYouTubeId(rawMovieUrl);
            if (youtubeId) {
              if (
                trailerSession !== trailerSessionRef.current ||
                !showTrailerRef.current
              )
                return;
              setSelectedGame((current) => ({
                ...(current || game),
                trailerUrl: `https://www.youtube.com/embed/${youtubeId}`,
                trailerType: "youtube",
                trailerPreview:
                  movie?.preview ||
                  game?.image ||
                  `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                trailerSearchUrl,
              }));
              return;
            }
          }
        } catch (movieError) {
          console.warn("RAWG movie lookup failed:", movieError);
        }

        if (
          trailerSession !== trailerSessionRef.current ||
          !showTrailerRef.current
        )
          return;
        setSelectedGame((current) => ({
          ...(current || game),
          trailerUrl: knownYoutubeTrailer,
          trailerType: knownYoutubeTrailer ? "youtube" : "search",
          trailerPreview: game?.image || "",
          trailerSearchUrl,
        }));
      } else {
        if (
          trailerSession !== trailerSessionRef.current ||
          !showTrailerRef.current
        )
          return;
        setSelectedGame((current) => ({
          ...(current || game),
          trailerUrl: knownYoutubeTrailer,
          trailerType: knownYoutubeTrailer ? "youtube" : "search",
          trailerPreview: game?.image || "",
          trailerSearchUrl,
        }));
      }
    } catch (error) {
      console.warn("Trailer lookup failed:", error);
      if (
        trailerSession !== trailerSessionRef.current ||
        !showTrailerRef.current
      )
        return;
      setSelectedGame((current) => ({
        ...(current || game),
        trailerUrl: knownYoutubeTrailer,
        trailerType: knownYoutubeTrailer ? "youtube" : "search",
        trailerPreview: game?.image || "",
        trailerSearchUrl,
      }));
    } finally {
      if (trailerSession === trailerSessionRef.current) {
        setTrailerLoading(false);
      }
    }
  };
  const openPoster = (game) => {
    if (!game?.image) return;

    // Poster click must NEVER open or retain the trailer.
    trailerSessionRef.current += 1;
    showTrailerRef.current = false;
    setShowTrailer(false);
    setTrailerLoading(false);
    setShowPoster(true);
  };

  const closePoster = () => {
    setShowPoster(false);
  };

  const closeTrailer = () => {
    trailerSessionRef.current += 1;
    showTrailerRef.current = false;
    setShowTrailer(false);
    setTrailerLoading(false);
    setShowDetails(false);
    setSelectedGame(null);
    setReviewMessage("");
    setSelectedReview(null);
  };
  const closeMeter = () => {
    if (reviewLoading) return;
    setSelectedGame(null);
    setShowDetails(false);
    setReviewMessage("");
    setSelectedReview(null);
  };
  const postCommunityReview = () => {
    const text = reviewText.trim();
    if (!selectedGame) return;
    if (!text) {
      setReviewMessage("Write a review before posting.");
      return;
    }
    const gameId = createGameId(selectedGame.name);
    const newReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userName: "Gamer",
      initials: "G",
      verdict: composerVerdict,
      text,
      createdAt: Date.now(),
      likes: 0,
      comments: 0,
      spoilers: showSpoilers,
      following: false,
    };
    const nextReviews = [newReview, ...communityReviews];
    setCommunityReviews(nextReviews);
    localStorage.setItem(
      `gamingverse_community_reviews_${gameId}`,
      JSON.stringify(nextReviews),
    );
    setReviewText("");
    setReviewMessage("✓ Review posted successfully.");
    addGamingVerseNotification(
      "GamingVerse Review",
      `Your ${composerVerdict.replace("-", " ")} review for ${selectedGame.name} was posted.`,
      "activity",
    );
    window.dispatchEvent(new Event("gamingverse-notification"));
    // Keep the existing GamingVerse Meter vote in sync with the review.
    submitReview(composerVerdict);
  };
  const toggleReviewLike = (reviewId) => {
    if (!selectedGame) return;
    const gameId = createGameId(selectedGame.name);
    const hasLiked = likedReviewIds.includes(reviewId);
    const nextLiked = hasLiked
      ? likedReviewIds.filter((id) => id !== reviewId)
      : [...likedReviewIds, reviewId];
    const nextReviews = communityReviews.map((review) =>
      review.id === reviewId
        ? {
            ...review,
            likes: Math.max(0, (review.likes || 0) + (hasLiked ? -1 : 1)),
          }
        : review,
    );
    setLikedReviewIds(nextLiked);
    setCommunityReviews(nextReviews);
    localStorage.setItem(
      `gamingverse_review_likes_${gameId}`,
      JSON.stringify(nextLiked),
    );
    localStorage.setItem(
      `gamingverse_community_reviews_${gameId}`,
      JSON.stringify(nextReviews),
    );
  };
  const formatReviewAge = (timestamp) => {
    const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };
  const visibleCommunityReviews = [...communityReviews]
    .filter((review) => !followingOnly || review.following)
    .sort((a, b) => {
      if (reviewFilter === "Newest") return b.createdAt - a.createdAt;
      return (b.likes || 0) - (a.likes || 0) || b.createdAt - a.createdAt;
    });
  /* =======================================================
       SAVE REVIEW
    ======================================================= */
  const submitReview = async (reviewId) => {
    try {
      if (!selectedGame) return;
      if (!auth.currentUser) {
        setReviewMessage("Please login first to submit your review.");
        return;
      }
      const userId = auth.currentUser.uid;
      const gameId = createGameId(selectedGame.name);
      setReviewLoading(true);
      setReviewMessage("");
      const reviewRef = ref(db, `gameReviews/${gameId}/${userId}`);
      await set(reviewRef, {
        gameId,
        gameName: selectedGame.name,
        userId,
        review: reviewId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSelectedReview(reviewId);
      setReviewMessage("✓ Your verdict has been saved.");
    } catch (error) {
      console.error("Review error:", error);
      setReviewMessage("Unable to save your verdict. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };
  /* =======================================================
       METER CALCULATION
    ======================================================= */
  const totalVotes = Object.values(reviewCounts).reduce(
    (sum, value) => sum + value,
    0,
  );
  const positiveVotes = reviewCounts.perfection + reviewCounts["go-for-it"];
  const meterPercent =
    totalVotes === 0 ? 0 : Math.round((positiveVotes / totalVotes) * 100);
  const meterText =
    totalVotes === 0 ? "No votes yet" : `${positiveVotes}/${totalVotes} Votes`;
  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  /* =======================================================
       TOP 100 GAMES
       Ranked by the GamingVerse Meter, not RAWG rating.
       A game gets its score from real GamingVerse verdicts saved
       in Firebase: Perfection + Go For It = positive votes.
  ======================================================= */
  useEffect(() => {
    const reviewsRef = ref(db, "gameReviews");
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const nextRatings = {};

      Object.entries(data).forEach(([gameId, gameReviews]) => {
        const counts = {
          perfection: 0,
          "go-for-it": 0,
          timepass: 0,
          skip: 0,
        };

        Object.values(gameReviews || {}).forEach((userReview) => {
          const verdict = userReview?.review;
          if (counts[verdict] !== undefined) {
            counts[verdict] += 1;
          }
        });

        const total = Object.values(counts).reduce(
          (sum, value) => sum + value,
          0,
        );
        const positive = counts.perfection + counts["go-for-it"];

        nextRatings[gameId] = {
          ...counts,
          total,
          positive,
          percent: total ? Math.round((positive / total) * 100) : 0,
        };
      });

      setGamingVerseRatings(nextRatings);
    });

    return () => unsubscribe();
  }, []);

  const discoverGames = useMemo(() => {
    const source = [...automaticGames, ...horizontalGames, ...posterGames];
    const seen = new Set();
    const unique = source.filter((game) => {
      const key = String(game?.name || "")
        .trim()
        .toLowerCase();
      if (!key || seen.has(key) || isBlockedGame(game)) return false;
      seen.add(key);
      return true;
    });

    const awardWinnerNames = new Set([
      "Portal",
      "BioShock",
      "BioShock: The Collection",
      "The Witcher 3: Wild Hunt",
      "Elden Ring",
      "God of War",
      "God of War Ragnarök",
      "Red Dead Redemption 2",
      "The Last of Us",
      "Baldur's Gate 3",
    ]);

    const familyFriendly = (game) => getRequiredGameAge(game?.name || "") <= 12;

    // Discover must work for both live RAWG games and GamingVerse's local games.
    // Local games often keep their platform/release/genre data inside gameDetails,
    // so the filter reads from both places instead of returning false too early.
    const getDiscoverData = (game) => {
      const details = getGameDetails(game?.name || "");
      const name = String(game?.name || "");
      const genre = String(game?.genre || details?.genre || "");
      const platforms = String(game?.platforms || details?.platforms || "");
      const releaseDate = String(
        game?.releaseDate || details?.releaseDate || "",
      );
      const text = `${name} ${genre} ${platforms}`.toLowerCase();
      const category = getGameCategory({ ...game, genre: `${genre} ${name}` });

      return { details, name, genre, platforms, releaseDate, text, category };
    };

    const isPc = (game) => /\bpc\b/i.test(getDiscoverData(game).platforms);
    const isConsole = (game) =>
      /(playstation|xbox|nintendo|switch)/i.test(
        getDiscoverData(game).platforms,
      );

    const matchesDiscoverGenre = (game, selectedGenre) => {
      if (selectedGenre === "All Genres") return true;
      const { name, genre, text, category } = getDiscoverData(game);
      const wanted = selectedGenre.toLowerCase();

      if (genre.toLowerCase().includes(wanted)) return true;
      if (category.toLowerCase() === wanted) return true;

      const genreAliases = {
        strategy:
          /strategy|tactics|turn-based|civilization|age of empires|total war|xcom|starcraft|warcraft|company of heroes|command & conquer|dota|league of legends/i,
        shooter:
          /shooter|fps|first-person|third-person shooter|call of duty|counter-strike|valorant|apex legends|fortnite|overwatch|rainbow six|pubg/i,
        racing: /racing|forza|need for speed|f1|gran turismo|the crew/i,
        sports:
          /sports|football|soccer|basketball|nba|fifa|fc 2|madden|nhl|mlb/i,
        adventure:
          /adventure|tomb raider|uncharted|last of us|god of war|ghost of tsushima|assassin/i,
        rpg: /rpg|role-playing|elden ring|witcher|cyberpunk|hogwarts|diablo|baldur|persona|dragon age|fallout/i,
        action:
          /action|resident evil|silent hill|dead space|alan wake|phasmophobia|outlast/i,
      };

      return Boolean(genreAliases[wanted]?.test(`${text} ${name}`));
    };

    let filtered = unique.filter((game) => {
      const { name, text, releaseDate } = getDiscoverData(game);
      const today = new Date().toISOString().slice(0, 10);

      if (discoverPlatform === "PC" && !isPc(game)) return false;
      if (discoverPlatform === "Console" && !isConsole(game)) return false;
      if (!matchesDiscoverGenre(game, discoverGenre)) return false;
      if (
        discoverRelease === "Released" &&
        (!releaseDate || releaseDate > today)
      )
        return false;
      if (
        discoverRelease === "Upcoming" &&
        (!releaseDate || releaseDate <= today)
      )
        return false;

      if (
        discoverPreset === "Popular RPGs" &&
        !matchesDiscoverGenre(game, "RPG")
      )
        return false;
      if (
        discoverPreset === "Top Rated Action" &&
        !matchesDiscoverGenre(game, "Action")
      )
        return false;
      if (discoverPreset === "Family Friendly" && !familyFriendly(game))
        return false;
      if (discoverPreset === "Award Winners" && !awardWinnerNames.has(name))
        return false;
      if (
        discoverPreset === "Multiplayer" &&
        !/(multiplayer|online|co-op|coop)/i.test(text)
      )
        return false;
      if (
        discoverPreset === "Open World" &&
        !/(open world|open-world)/i.test(text)
      )
        return false;

      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      if (discoverSort === "Highest Rated") {
        const aMeter = gamingVerseRatings[createGameId(a?.name || "")];
        const bMeter = gamingVerseRatings[createGameId(b?.name || "")];
        const meterDifference =
          (Number(bMeter?.percent) || 0) - (Number(aMeter?.percent) || 0);
        if (meterDifference !== 0) return meterDifference;
        return (Number(bMeter?.total) || 0) - (Number(aMeter?.total) || 0);
      }
      if (discoverSort === "Most GamingVerse Voted") {
        const av =
          Number(gamingVerseRatings[createGameId(a?.name || "")]?.total) || 0;
        const bv =
          Number(gamingVerseRatings[createGameId(b?.name || "")]?.total) || 0;
        return bv - av;
      }
      return String(b?.releaseDate || "").localeCompare(
        String(a?.releaseDate || ""),
      );
    });

    return filtered.slice(0, 24);
  }, [
    automaticGames,
    horizontalGames,
    posterGames,
    discoverSort,
    discoverPlatform,
    discoverGenre,
    discoverRelease,
    discoverPreset,
    gamingVerseRatings,
  ]);

  const discoverHasSelection =
    Boolean(discoverPreset) ||
    discoverPlatform !== "All Platforms" ||
    discoverGenre !== "All Genres" ||
    discoverRelease !== "All Releases";

  const top100Games = useMemo(() => {
    const source = [...automaticGames, ...horizontalGames, ...posterGames];
    const seen = new Set();

    const unique = source.filter((game) => {
      const key = String(game?.name || "")
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const filtered = unique.filter((game) => {
      const gameId = createGameId(game?.name || "");
      const meter = gamingVerseRatings[gameId];
      const platforms = String(game?.platforms || "").toLowerCase();

      if (top100Sort === "PC" && !platforms.includes("pc")) return false;
      if (top100Sort === "Console" && !/(playstation|xbox)/i.test(platforms))
        return false;

      // GamingVerse filters only use real GamingVerse votes.
      if (!meter || meter.total === 0) return top100Filter === "All";
      if (top100Filter === "Perfection") return meter.percent >= 90;
      if (top100Filter === "Go For It")
        return meter.percent >= 70 && meter.percent < 90;
      if (top100Filter === "Timepass")
        return meter.percent >= 40 && meter.percent < 70;
      if (top100Filter === "Skip") return meter.percent < 40;
      return true;
    });

    return [...filtered]
      .sort((a, b) => {
        const aMeter = gamingVerseRatings[createGameId(a?.name || "")];
        const bMeter = gamingVerseRatings[createGameId(b?.name || "")];
        const ratingDifference =
          (Number(bMeter?.percent) || 0) - (Number(aMeter?.percent) || 0);
        if (ratingDifference !== 0) return ratingDifference;

        const voteDifference =
          (Number(bMeter?.total) || 0) - (Number(aMeter?.total) || 0);
        if (voteDifference !== 0) return voteDifference;

        return String(a?.name || "").localeCompare(String(b?.name || ""));
      })
      .slice(0, 100);
  }, [
    automaticGames,
    horizontalGames,
    posterGames,
    gamingVerseRatings,
    top100Filter,
    top100Sort,
  ]);

  const top100FormatVotes = (count) => {
    const value = Number(count) || 0;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
  };

  const top100Year = (releaseDate) => {
    const match = String(releaseDate || "").match(/(\d{4})/);
    return match ? match[1] : "—";
  };
  const directOpenGameName = searchParams.get("openGame");

  if (directOpenGameName && !selectedGame) {
    return (
      <div
        className="games-page"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#050509",
          color: "#b45cff",
          fontWeight: 800,
        }}
      >
        Opening {decodeURIComponent(directOpenGameName)}...
      </div>
    );
  }

  return (
    <div className="games-page">
      {/* ===================================================
            NAVBAR
        =================================================== */}

      <header className="games-navbar">
        <button
          className="brand brand-home-button"
          type="button"
          title="GamingVerse Home"
          aria-label="GamingVerse Home"
          style={{
            border: "none",
            outline: "none",
            padding: 0,
            margin: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            textAlign: "left",
            cursor: "pointer",
          }}
          onClick={() => {
            setActiveView("home");
            setActiveCategory("All");
            setSearch("");
            setShowNotifications(false);
            setShowDiscoverMenu(false);
            setShowProfileMenu(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-icon" aria-hidden="true">
            🎮
          </span>

          <span className="brand-text">
            <h2>
              Gaming<span>Verse</span>
            </h2>

            <small>Level up your gaming experience</small>
          </span>
        </button>

        <nav className="games-main-nav">
          <button
            className={`nav-icon-link ${
              activeView === "home" && activeCategory === "All" ? "active" : ""
            }`}
            title="Home"
            aria-label="Home"
            onClick={() => {
              setActiveView("home");
              setActiveCategory("All");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="home-navbar-icon" aria-hidden="true">
              ⌂
            </span>
            <span className="nav-icon-label">Home</span>
          </button>

          <button
            className={`nav-icon-link ${
              activeView === "upcomings" ? "active" : ""
            }`}
            title="Upcomings"
            aria-label="Upcomings"
            onClick={() => {
              setActiveView("upcomings");
              setActiveCategory("All");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <GVIcon name="calendar" />
            <span className="nav-icon-label">Upcomings</span>
          </button>

          <button
            className={`nav-icon-link ${
              activeView === "trailers" ? "active" : ""
            }`}
            title="Spaces"
            aria-label="Spaces"
            onClick={() => {
              setActiveView("trailers");
              setSpacesSection("feed");
            }}
          >
            <GVIcon name="spaces" />
            <span className="nav-icon-label">Spaces</span>
          </button>

          {/* CD MARKETPLACE */}
          <button
            className={`nav-icon-link marketplace-nav-button ${
              activeView === "marketplace" ? "active" : ""
            }`}
            type="button"
            title="Marketplace • Games, CDs & Accessories"
            aria-label="CD Marketplace"
            onClick={() => {
              setActiveView("marketplace");
              setActiveCategory("All");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <GVIcon name="cart" />
            <span className="nav-icon-label">Marketplace</span>
          </button>

          {/* GAMING CAFÉ BOOKING */}
          <button
            className={`nav-icon-link cafe-nav-button ${
              activeView === "cafe" ? "active" : ""
            }`}
            type="button"
            title="Café • Book a Gaming Session"
            aria-label="Gaming Café Booking"
            onClick={() => {
              setActiveView("cafe");
              setActiveCategory("All");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="cafe-navbar-icon" aria-hidden="true">
              🎮
            </span>
            <span className="nav-icon-label">Café</span>
          </button>
        </nav>

        <div className="navbar-right">
          <div className="search-box">
            <button
              type="button"
              className="search-icon-button"
              onClick={focusSearch}
              aria-label="Focus search"
              title="Search games"
            >
              <GVIcon name="search" size={18} />
            </button>

            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchResults.length > 0) {
                    setSearch("");
                    setActiveView("home");
                    openDetails(searchResults[0]);
                  } else {
                    document.querySelector(".games-content")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }

                if (e.key === "Escape") {
                  setSearch("");
                  e.currentTarget.blur();
                }
              }}
              aria-label="Search games"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setSearch("");
                  focusSearch();
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {search.trim() && (
            <div className="search-results-dropdown">
              <div className="search-results-header">
                <span>SEARCH RESULTS</span>
                <strong>{searchResults.length}</strong>
              </div>

              {searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.slice(0, 8).map((game) => (
                    <button
                      key={`search-${game.name}`}
                      type="button"
                      className="search-result-item"
                      onClick={() => {
                        setSearch("");
                        setActiveView("home");
                        openDetails(game);
                      }}
                    >
                      <img src={game.image} alt={game.name} />
                      <span>
                        <strong>{game.name}</strong>
                        <small>
                          {getGameDetails(game.name).genre || "Game"}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  <span>🎮</span>
                  <strong>No games found</strong>
                  <small>Try a different game name.</small>
                </div>
              )}
            </div>
          )}

          <div className="navbar-profile-layer" ref={profileMenuRef}>
            <div className="navbar-icon-actions">
              <button
                type="button"
                className={`navbar-icon-button discover-menu-button ${showDiscoverMenu ? "active" : ""}`}
                onClick={() => {
                  setShowDiscoverMenu((current) => !current);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
                aria-label="Discover menu"
                aria-expanded={showDiscoverMenu}
                title="Discover"
              >
                <span className="navbar-icon">
                  <GVIcon name="grid" size={19} />
                </span>
              </button>

              <button
                type="button"
                className={`navbar-icon-button ${showNotifications ? "active" : ""}`}
                onClick={() => {
                  setShowNotifications((current) => !current);
                  setShowProfileMenu(false);
                }}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <span className="navbar-icon">
                  <GVIcon name="bell" size={19} />
                </span>
                <span className="notification-dot" aria-hidden="true"></span>
              </button>

              <button
                type="button"
                className="navbar-icon-button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowNotifications(false);
                  navigate("/profile");
                }}
                aria-label="Open profile"
                title="Profile"
              >
                <span className="profile-avatar profile-avatar-button">
                  <GVIcon name="user" size={20} />
                </span>
              </button>
            </div>

            {showDiscoverMenu && (
              <div className="navbar-popover discover-popover">
                <div className="discover-grid">
                  {[
                    { icon: "〽", label: "Following Activity" },
                    { icon: "⌖", label: "Discover" },
                    { icon: "♛", label: "Top 100" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="discover-menu-item"
                      onMouseDown={() => {
                        if (item.label === "Discover") {
                          setActiveView("discover");
                          setSearch("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      onClick={() => {
                        setShowDiscoverMenu(false);
                        if (item.label === "Following Activity") {
                          navigate("/games?view=following");
                        } else if (item.label === "Top 100") {
                          navigate("/games?view=top100");
                        }
                      }}
                    >
                      <span className="discover-menu-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showNotifications && (
              <div className="navbar-popover notifications-popover">
                <div className="popover-header">
                  <h3>Notifications</h3>
                  <button
                    type="button"
                    className="popover-header-action"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    ×
                  </button>
                </div>

                <div className="notification-tabs">
                  <button
                    type="button"
                    className={notificationTab === "all" ? "active" : ""}
                    onClick={() => setNotificationTab("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={notificationTab === "updates" ? "active" : ""}
                    onClick={() => setNotificationTab("updates")}
                  >
                    Updates
                  </button>
                  <button
                    type="button"
                    className={notificationTab === "activity" ? "active" : ""}
                    onClick={() => setNotificationTab("activity")}
                  >
                    Activity
                  </button>
                </div>

                <div className="notification-body">
                  {(() => {
                    const visibleNotifications = notifications.filter((item) =>
                      notificationTab === "all"
                        ? true
                        : notificationTab === "updates"
                          ? item.type === "update"
                          : item.type === "activity",
                    );

                    return visibleNotifications.length ? (
                      <>
                        <div className="notification-period">Last 30 Days</div>
                        {visibleNotifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`notification-item ${item.read ? "is-read" : ""}`}
                            onClick={() => {
                              const next = notifications.map((notification) =>
                                notification.id === item.id
                                  ? { ...notification, read: true }
                                  : notification,
                              );
                              setNotifications(next);
                              localStorage.setItem(
                                "gamingverse_notifications",
                                JSON.stringify(next),
                              );
                            }}
                          >
                            <div
                              className={`notification-avatar ${item.type === "update" ? "purple" : ""}`}
                            >
                              {item.type === "update" ? "★" : "G"}
                            </div>
                            <div className="notification-copy">
                              <strong>{item.title}</strong>
                              <p>{item.message}</p>
                              <span>{formatActivityDate(item.createdAt)}</span>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="notification-empty-state">
                        <span>{notificationTab === "updates" ? "✦" : "◌"}</span>
                        <strong>
                          {notificationTab === "updates"
                            ? "No new updates"
                            : "No recent activity"}
                        </strong>
                        <p>
                          {notificationTab === "updates"
                            ? "You are all caught up."
                            : "Your latest GamingVerse activity will appear here."}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="notification-footer">
                  Notifications are automatically removed after 30 days
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {activeView === "upcomings" && (
        <section className="games-upcomings-page">
          <div className="games-content">
            <section className="game-section upcoming-games-section">
              <div className="section-heading automatic-games-heading">
                <div>
                  <span className="section-label">UPCOMING RELEASES</span>
                  <h2>Upcoming PC & Console Games</h2>
                  <p className="catalogue-subtitle">
                    Only games with a future release date are shown here.
                  </p>
                </div>
              </div>

              {upcomingGamesLoading ? (
                <div className="automatic-games-message">
                  <span>🎮</span>
                  <div>
                    <strong>Loading upcoming games...</strong>
                    <p>Checking the latest future release dates.</p>
                  </div>
                </div>
              ) : upcomingGamesError ? (
                <div className="automatic-games-message">
                  <span>⚠️</span>
                  <div>
                    <strong>Upcoming games are unavailable.</strong>
                    <p>{upcomingGamesError}</p>
                  </div>
                </div>
              ) : filteredUpcomingGames.length > 0 ? (
                <div className="automatic-games-grid">
                  {filteredUpcomingGames.map((game) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);

                    return (
                      <article
                        className={`automatic-game-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`upcoming-${game.rawgId || game.name}`}
                        onClick={() => openDetails(game)}
                        title={
                          !accessible ? `Requires ${requiredAge}+` : game.name
                        }
                      >
                        <div className="automatic-game-image-wrap">
                          <img
                            src={game.image}
                            alt={game.name}
                            loading="lazy"
                          />
                          <div className="automatic-game-image-gradient"></div>
                          <div className="automatic-game-source-badge">
                            UPCOMING
                          </div>
                          <div className="automatic-game-age-badge">
                            {requiredAge}+
                          </div>

                          {!accessible && (
                            <div className="automatic-game-lock">
                              <span>🔒</span>
                              <strong>{requiredAge}+</strong>
                              <small>Age restricted</small>
                            </div>
                          )}
                        </div>

                        <div className="automatic-game-info">
                          <h3>{game.name}</h3>
                          <div className="automatic-game-meta">
                            <span>
                              ⭐ {game.rating ? game.rating.toFixed(1) : "New"}
                            </span>
                            <span>{game.genre}</span>
                          </div>
                          <div className="automatic-game-platforms">
                            🎮 {game.platforms}
                          </div>

                          <button
                            className="card-details-button automatic-card-view-details"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetails(game);
                            }}
                          >
                            {accessible ? "View Details" : "Age Restricted"}
                          </button>

                          <div className="automatic-game-footer">
                            <span>{game.releaseDate}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="automatic-games-message">
                  <span>📅</span>
                  <div>
                    <strong>No upcoming games found</strong>
                    <p>
                      There are no future releases matching the selected filter.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      )}

      {activeView === "discover" && (
        <section className="discover-games-page">
          <div className="discover-games-layout">
            <aside className="discover-games-sidebar">
              <div className="discover-sidebar-title">FILTERS</div>

              <label className="discover-filter-label">
                <span>SORT BY</span>
                <select
                  value={discoverSort}
                  onChange={(event) => setDiscoverSort(event.target.value)}
                >
                  <option>Newest Releases</option>
                  <option>Highest Rated</option>
                  <option>Most GamingVerse Voted</option>
                </select>
              </label>

              <div className="discover-filter-group">
                <span className="discover-filter-heading">GAME TYPE</span>
                {[
                  ["All Platforms", "🎮"],
                  ["PC", "▣"],
                  ["Console", "◈"],
                ].map(([label, icon]) => (
                  <button
                    key={label}
                    type="button"
                    className={`discover-filter-button ${discoverPlatform === label ? "active" : ""}`}
                    onClick={() => {
                      setDiscoverPlatform(label);
                      setDiscoverPreset("");
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div className="discover-filter-group">
                <span className="discover-filter-heading">GENRE</span>
                {[
                  "All Genres",
                  "Action",
                  "Adventure",
                  "RPG",
                  "Racing",
                  "Sports",
                  "Shooter",
                  "Strategy",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`discover-filter-button ${discoverGenre === label ? "active" : ""}`}
                    onClick={() => {
                      setDiscoverGenre(label);
                      setDiscoverPreset("");
                    }}
                  >
                    <span className="discover-filter-dot" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="discover-filter-group">
                <span className="discover-filter-heading">RELEASE</span>
                {["All Releases", "Released", "Upcoming"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`discover-filter-button ${discoverRelease === label ? "active" : ""}`}
                    onClick={() => {
                      setDiscoverRelease(label);
                      setDiscoverPreset("");
                    }}
                  >
                    <span className="discover-filter-dot release-dot" />
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="discover-clear-button"
                onClick={() => {
                  setDiscoverSort("Newest Releases");
                  setDiscoverPlatform("All Platforms");
                  setDiscoverGenre("All Genres");
                  setDiscoverRelease("All Releases");
                  setDiscoverPreset("");
                }}
              >
                Reset filters
              </button>
            </aside>

            <main className="discover-games-main">
              <div className="discover-games-header">
                <div>
                  <span className="section-label">DISCOVER</span>
                  <h1>Find Exactly What You Want to Play</h1>
                  <p>
                    Adjust the filters to discover games tailored to your
                    platform, genre, release type and gaming style.
                  </p>
                </div>
              </div>

              <div className="discover-games-hero">
                <div className="discover-hero-icon">
                  <GVIcon name="grid" size={38} />
                </div>
                <h2>Discover Your Next Game</h2>
                <p>
                  Pick a filter or try a quick preset to build your perfect
                  gaming list.
                </p>

                <div className="discover-quick-divider" />
                <span className="discover-quick-title">
                  OR TRY A QUICK PRESET
                </span>

                <div className="discover-presets">
                  {[
                    ["Popular RPGs", "⚡"],
                    ["Top Rated Action", "✦"],
                    ["Family Friendly", "♡"],
                    ["Award Winners", "♕"],
                    ["Multiplayer", "✣"],
                    ["Open World", "✧"],
                  ].map(([label, icon]) => (
                    <button
                      key={label}
                      type="button"
                      className={`discover-preset ${discoverPreset === label ? "active" : ""}`}
                      onClick={() => {
                        setDiscoverPreset(label);
                        setDiscoverPlatform("All Platforms");
                        setDiscoverGenre("All Genres");
                        setDiscoverRelease("All Releases");
                      }}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {discoverHasSelection && (
                <section className="discover-results-section">
                  <div className="discover-results-heading">
                    <div>
                      <span className="section-label">MATCHES</span>
                      <h2>{discoverGames.length} games found</h2>
                    </div>
                    <span>GamingVerse Discover</span>
                  </div>

                  {discoverGames.length > 0 ? (
                    <div className="discover-results-grid">
                      {discoverGames.map((game) => {
                        const accessible = canAccessGame(game, userAge);
                        const requiredAge = getRequiredGameAge(game.name);
                        const meter =
                          gamingVerseRatings[createGameId(game.name)] || {};
                        return (
                          <article
                            className="discover-result-card"
                            key={`discover-${game.rawgId || game.name}`}
                            onClick={() => openDetails(game)}
                          >
                            <div className="discover-result-image">
                              {game.image ? (
                                <img
                                  src={game.image}
                                  alt={game.name}
                                  loading="lazy"
                                />
                              ) : (
                                <span>🎮</span>
                              )}
                              <span className="discover-result-age">
                                {requiredAge}+
                              </span>
                            </div>
                            <div className="discover-result-info">
                              <h3>{game.name}</h3>
                              <p>{game.genre || getGameCategory(game)}</p>
                              <div className="discover-result-meta">
                                <span>{game.platforms || "PC • Console"}</span>
                                {meter.total > 0 && (
                                  <strong>{meter.percent}% GV</strong>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDetails(game);
                                }}
                              >
                                {accessible ? "View Details" : "View Access"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="discover-no-results">
                      <span>🎮</span>
                      <h2>No games match these filters</h2>
                      <p>Try another genre, platform or quick preset.</p>
                    </div>
                  )}
                </section>
              )}
            </main>
          </div>
        </section>
      )}

      {activeView === "top100" && (
        <section className="top100-games-page">
          <div className="top100-games-layout">
            <aside className="top100-games-sidebar">
              <div className="top100-sidebar-title">FILTER BY</div>
              {[
                ["All", "#a83fff"],
                ["Perfection", "#a83fff"],
                ["Go For It", "#00d084"],
                ["Timepass", "#ffb400"],
                ["Skip", "#ff5c7a"],
              ].map(([label, dot]) => (
                <button
                  key={`top100-filter-${label}`}
                  type="button"
                  className={`top100-filter-option ${top100Filter === label ? "active" : ""}`}
                  onClick={() => setTop100Filter(label)}
                >
                  <span
                    className="top100-filter-dot"
                    style={{ background: dot }}
                  />
                  <span>{label}</span>
                </button>
              ))}

              <div className="top100-sidebar-divider" />
              <div className="top100-sidebar-title">SORT BY</div>
              {["Game", "PC", "Console"].map((label) => (
                <button
                  key={`top100-sort-${label}`}
                  type="button"
                  className={`top100-sort-option ${top100Sort === label ? "active" : ""}`}
                  onClick={() => setTop100Sort(label)}
                >
                  <span className="top100-radio" />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            <main className="top100-games-main">
              <div className="top100-games-heading">
                <h1>Top 100 Games</h1>
                <span>{top100Games.length} games • GamingVerse Meter</span>
              </div>

              <div className="top100-games-list">
                {top100Games.map((game, index) => {
                  const meter =
                    gamingVerseRatings[createGameId(game?.name || "")] || {};
                  const percent = Number.isFinite(Number(meter.percent))
                    ? Number(meter.percent)
                    : 0;
                  const votes = Number(meter.total) || 0;
                  const circumference = 282.74;
                  const dashOffset =
                    circumference - (circumference * percent) / 100;

                  return (
                    <article
                      className="top100-game-row"
                      key={`top100-${game.name}-${index}`}
                    >
                      <div className={`top100-rank rank-${index + 1}`}>
                        {index + 1}
                      </div>

                      <button
                        type="button"
                        className="top100-game-poster"
                        onClick={() => openDetails(game)}
                        aria-label={`Open ${game.name}`}
                      >
                        {game.image ? (
                          <img src={game.image} alt={game.name} />
                        ) : (
                          <span>🎮</span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="top100-game-info"
                        onClick={() => openDetails(game)}
                      >
                        <h2>{game.name}</h2>
                        <p>Game • {top100Year(game.releaseDate)}</p>
                      </button>

                      <div className="top100-score">
                        <svg
                          viewBox="0 0 200 105"
                          aria-label={`${percent}% GamingVerse Meter rating`}
                        >
                          <path
                            className="top100-score-track"
                            d="M10 95 A90 90 0 0 1 190 95"
                          />
                          <path
                            className="top100-score-progress"
                            d="M10 95 A90 90 0 0 1 190 95"
                            style={{
                              strokeDasharray: circumference,
                              strokeDashoffset: dashOffset,
                            }}
                          />
                        </svg>
                        <strong>{percent}%</strong>
                        <span>
                          {votes
                            ? `${top100FormatVotes(votes)} GamingVerse Votes`
                            : "No GamingVerse votes yet"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {top100Games.length === 0 && (
                <div className="top100-games-empty">
                  <span>🎮</span>
                  <h2>No games match this filter</h2>
                  <p>
                    Only games with GamingVerse community votes appear in this
                    filter.
                  </p>
                </div>
              )}
            </main>
          </div>
        </section>
      )}

      {activeView === "following" && (
        <section className="following-activity-page">
          <div className="following-activity-layout">
            <aside className="following-activity-sidebar">
              <div className="activity-sidebar-title">FILTER BY</div>
              {[
                ["All", "#a83fff"],
                ["Perfection", "#a83fff"],
                ["Go For It", "#00d084"],
                ["Timepass", "#ffb400"],
                ["Skip", "#ff5c7a"],
              ].map(([label, dot]) => (
                <button
                  key={label}
                  type="button"
                  className={`activity-filter-option ${activityFilter === label ? "active" : ""}`}
                  onClick={() => setActivityFilter(label)}
                >
                  <span
                    className="activity-filter-dot"
                    style={{ background: dot }}
                  />
                  <span>{label}</span>
                </button>
              ))}

              <div className="activity-sidebar-divider" />
              <div className="activity-sidebar-title">SORT BY</div>
              {["Recent", "Movie", "Show", "Anime"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`activity-sort-option ${activitySort === label ? "active" : ""}`}
                  onClick={() => {
                    if (["Movie", "Show", "Anime"].includes(label)) {
                      setActivityType(label);
                    }
                    setActivitySort(label);
                  }}
                >
                  <span className="activity-radio" />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            <main className="following-activity-main">
              <div className="following-activity-heading">
                <h1>Activity</h1>
                <p>See what your friends are reviewing</p>
              </div>

              {(() => {
                const verdictMap = {
                  All: null,
                  Perfection: "perfection",
                  "Go For It": "go-for-it",
                  Timepass: "timepass",
                  Skip: "skip",
                };
                const wantedVerdict = verdictMap[activityFilter];
                let visible = activityReviews.filter(
                  (review) =>
                    !wantedVerdict || review.verdict === wantedVerdict,
                );

                if (activitySort === "Recent") {
                  visible = [...visible].sort(
                    (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
                  );
                }

                const groups = {};
                visible.forEach((review) => {
                  const date = new Date(review.createdAt || Date.now());
                  const now = new Date();
                  const days = Math.floor((now - date) / 86400000);
                  const label =
                    days < 7
                      ? "Last Week"
                      : date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        });
                  if (!groups[label]) groups[label] = [];
                  groups[label].push(review);
                });

                const groupEntries = Object.entries(groups);

                return groupEntries.length ? (
                  <div className="following-activity-timeline">
                    {groupEntries.map(([period, items]) => (
                      <section className="activity-period" key={period}>
                        <h2>{period}</h2>
                        {items.map((review) => {
                          const verdictLabel =
                            {
                              perfection: "Perfection",
                              "go-for-it": "Go For It",
                              timepass: "Timepass",
                              skip: "Skip",
                            }[review.verdict] || "Perfection";
                          const when = review.createdAt
                            ? formatActivityDate(review.createdAt)
                            : "Recently";
                          return (
                            <article
                              className="activity-review-card"
                              key={`${review.gameId}-${review.id}`}
                            >
                              <div className="activity-timeline-line" />
                              <div className="activity-review-poster">
                                {review.gameImage ? (
                                  <img src={review.gameImage} alt="" />
                                ) : (
                                  <div className="activity-poster-fallback">
                                    🎮
                                  </div>
                                )}
                              </div>
                              <div className="activity-review-copy">
                                <div className="activity-review-user">
                                  <span className="activity-user-avatar">
                                    {review.initials ||
                                      String(review.userName || "G")
                                        .charAt(0)
                                        .toUpperCase()}
                                  </span>
                                  <strong>{review.userName || "Gamer"}</strong>
                                  <span>reviewed</span>
                                </div>
                                <h3>
                                  {String(
                                    review.gameName || review.gameId || "Game",
                                  ).replace(/[-_]+/g, " ")}
                                </h3>
                                <span className="activity-review-date">
                                  {when}
                                </span>
                              </div>
                              <span
                                className={`activity-verdict-badge ${review.verdict || "perfection"}`}
                              >
                                {verdictLabel}
                              </span>
                            </article>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="following-activity-empty">
                    <span>◌</span>
                    <h2>No recent activity</h2>
                    <p>Reviews from people you follow will appear here.</p>
                  </div>
                );
              })()}
            </main>
          </div>
        </section>
      )}

      {activeView === "home" && (
        <>
          {/* ===================================================
            HERO
        =================================================== */}

          {heroGames.length > 0 && (
            <section className="hero-section">
              <div className="hero-image-wrapper">
                <div className="hero-media">
                  <img
                    key={heroGames[heroIndex % heroGames.length].image}
                    src={heroGames[heroIndex % heroGames.length].image}
                    alt={heroGames[heroIndex % heroGames.length].name}
                    className="hero-image"
                  />
                  <div className="hero-overlay"></div>
                </div>

                <div className="hero-content">
                  <div className="hero-badge">🔥 FEATURED GAME</div>

                  <h1>{heroGames[heroIndex % heroGames.length].name}</h1>

                  <p>
                    {getGameDetails(
                      heroGames[heroIndex % heroGames.length].name,
                    ).description ||
                      "Explore amazing worlds, unforgettable adventures and legendary gaming experiences."}
                  </p>

                  <div className="hero-buttons">
                    <button
                      className="play-button"
                      type="button"
                      onClick={() =>
                        openDetails(heroGames[heroIndex % heroGames.length])
                      }
                    >
                      ▶ View Game
                    </button>
                  </div>
                </div>

                <div className="hero-carousel">
                  <div className="hero-thumbnails">
                    {heroGames.map((game, index) => (
                      <button
                        key={`hero-thumb-${game.name}`}
                        type="button"
                        className={`hero-thumb ${index === heroIndex ? "active" : ""}`}
                        onClick={() => setHeroIndex(index)}
                        aria-label={`Show ${game.name}`}
                      >
                        <img src={game.image} alt="" />
                        <span>{game.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="hero-carousel-arrows">
                    <button
                      type="button"
                      onClick={() =>
                        setHeroIndex(
                          (heroIndex - 1 + heroGames.length) % heroGames.length,
                        )
                      }
                      aria-label="Previous featured game"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setHeroIndex((heroIndex + 1) % heroGames.length)
                      }
                      aria-label="Next featured game"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ===================================================
            FEATURED GAMES
        =================================================== */}

          <main className="games-content">
            <section className="game-section">
              <div className="section-heading featured-games-heading">
                <div>
                  <span className="section-label">DISCOVER</span>
                  <h2>Featured Games</h2>
                </div>

                <div className="featured-games-actions">
                  <label className="home-category-select">
                    <span>Category</span>
                    <select
                      value={activeCategory}
                      onChange={(event) =>
                        setActiveCategory(event.target.value)
                      }
                      aria-label="Featured games category"
                    >
                      <option value="All">All Categories</option>
                      <option value="Action">Action</option>
                      <option value="Adventure">Adventure</option>
                      <option value="RPG">RPG</option>
                      <option value="Racing">Racing</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </label>

                  <button
                    className="view-all"
                    type="button"
                    onClick={() => setShowAllFeaturedGames((prev) => !prev)}
                  >
                    {showAllFeaturedGames ? "Show Less ↑" : "View All →"}
                  </button>
                </div>
              </div>

              <div className="horizontal-grid">
                {filteredHorizontal
                  .filter((game) => !containsBlockedGameTerm(game.name))
                  .slice(
                    0,
                    showAllFeaturedGames ? filteredHorizontal.length : 3,
                  )
                  .map((game, index) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);
                    const blocked = isBlockedGame(game);

                    return (
                      <div
                        className={`horizontal-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`${game.name}-${index}`}
                        onClick={() => openDetails(game)}
                        title={
                          !accessible
                            ? blocked
                              ? "Unavailable: blocked by GamingVerse safety system"
                              : `Requires ${requiredAge}+`
                            : game.name
                        }
                      >
                        <img src={game.image} alt={game.name} />

                        <div className="card-gradient"></div>

                        {!accessible && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 4,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              background: "rgba(0,0,0,0.56)",
                              backdropFilter: "blur(2px)",
                              textAlign: "center",
                              pointerEvents: "none",
                            }}
                          >
                            <span style={{ fontSize: "30px" }}>🔒</span>
                            <strong style={{ fontSize: "15px" }}>
                              {blocked ? "Unavailable" : `${requiredAge}+`}
                            </strong>
                            <small style={{ color: "rgba(255,255,255,0.72)" }}>
                              {blocked ? "Safety restricted" : "Age restricted"}
                            </small>
                          </div>
                        )}

                        <div className="horizontal-info">
                          <h3>{game.name}</h3>

                          <div className="game-meta">
                            <span>⭐ 4.8</span>
                            <span>🎮 Action</span>
                            <span>{gameAgeRatings[game.name] || "16+"}</span>
                          </div>

                          <button
                            className="card-details-button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(game);
                            }}
                          >
                            {accessible ? "View Details" : "Age Restricted"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* =================================================
            AUTOMATIC GAME CATALOGUE
            ================================================= */}
            <section className="game-section automatic-games-section">
              <div className="section-heading automatic-games-heading">
                <div>
                  <span className="section-label">LIVE CATALOGUE</span>
                  <h2>Latest PC & Console Games</h2>
                </div>

                <button
                  className="view-all automatic-view-all"
                  type="button"
                  onClick={() => {
                    const nextShowAll = !showAllAutomaticGames;
                    setShowAllAutomaticGames(nextShowAll);
                    if (nextShowAll) {
                      setSearch("");
                      setActiveCategory("All");
                    }
                    requestAnimationFrame(() => {
                      document
                        .querySelector(".automatic-games-section")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    });
                  }}
                >
                  {showAllAutomaticGames ? "Show Less ↑" : "View All →"}
                </button>
              </div>

              {automaticGamesError ? (
                <div className="automatic-games-message">
                  <span>⚠️</span>
                  <div>
                    <strong>Automatic games are not connected yet.</strong>
                    <p>{automaticGamesError}</p>
                  </div>
                </div>
              ) : filteredAutomaticGames.length > 0 ? (
                <div className="automatic-games-grid">
                  {visibleAutomaticGames.map((game) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);

                    return (
                      <article
                        className={`automatic-game-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`automatic-${game.rawgId || game.name}`}
                        onClick={() => openDetails(game)}
                        title={
                          !accessible ? `Requires ${requiredAge}+` : game.name
                        }
                      >
                        <div className="automatic-game-image-wrap">
                          <img
                            src={game.image}
                            alt={game.name}
                            loading="lazy"
                          />
                          <div className="automatic-game-image-gradient"></div>

                          <div className="automatic-game-source-badge">
                            AUTO
                          </div>
                          <div className="automatic-game-age-badge">
                            {requiredAge}+
                          </div>

                          {!accessible && (
                            <div className="automatic-game-lock">
                              <span>🔒</span>
                              <strong>{requiredAge}+</strong>
                              <small>Age restricted</small>
                            </div>
                          )}
                        </div>

                        <div className="automatic-game-info">
                          <h3>{game.name}</h3>
                          <div className="automatic-game-meta">
                            <span>
                              ⭐ {game.rating ? game.rating.toFixed(1) : "New"}
                            </span>
                            <span>{game.genre}</span>
                          </div>
                          <div className="automatic-game-platforms">
                            🎮 {game.platforms}
                          </div>

                          <button
                            className="card-details-button automatic-card-view-details"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetails(game);
                            }}
                          >
                            {accessible ? "View Details" : "Age Restricted"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="automatic-games-message">
                  <span>🎮</span>
                  <div>
                    <strong>No automatic games found</strong>
                    <p>
                      Try clearing the search or refresh the GamingVerse
                      catalogue.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
            COLLECTIONS
            ================================================= */}

            {/* =================================================
            ALL GAMES
        ================================================= */}

            <section className="game-section">
              <div className="section-heading">
                <div>
                  <span className="section-label">COLLECTION</span>
                  <h2>All Games</h2>
                </div>

                <button
                  className="view-all"
                  type="button"
                  onClick={() => setShowAllCatalogueGames((prev) => !prev)}
                >
                  {showAllCatalogueGames ? "Show Less ↑" : "View All →"}
                </button>
              </div>

              <div className="poster-grid">
                {filteredPosters
                  .filter((game) => !containsBlockedGameTerm(game.name))
                  .slice(0, showAllCatalogueGames ? filteredPosters.length : 6)
                  .map((game, index) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);
                    const blocked = isBlockedGame(game);

                    return (
                      <div
                        className={`poster-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`${game.name}-${index}`}
                      >
                        <div
                          className="poster-image-wrapper"
                          onClick={() => openDetails(game)}
                          title={
                            !accessible
                              ? blocked
                                ? "Unavailable: blocked by GamingVerse safety system"
                                : `Requires ${requiredAge}+`
                              : game.name
                          }
                        >
                          {game.image ? (
                            <img src={game.image} alt={game.name} />
                          ) : (
                            <div className="database-game-fallback">
                              <span>🎮</span>
                              <strong>{game.name}</strong>
                            </div>
                          )}

                          {!accessible && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                background: "rgba(0,0,0,0.52)",
                                textAlign: "center",
                                borderRadius: "inherit",
                                pointerEvents: "none",
                              }}
                            >
                              <span style={{ fontSize: "25px" }}>🔒</span>
                              <strong style={{ fontSize: "13px" }}>
                                {blocked ? "Unavailable" : `${requiredAge}+`}
                              </strong>
                              <small
                                style={{ color: "rgba(255,255,255,0.72)" }}
                              >
                                {blocked
                                  ? "Safety restricted"
                                  : "Age restricted"}
                              </small>
                            </div>
                          )}

                          <div className="poster-overlay">
                            <button
                              className="quick-play"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(game);
                              }}
                            >
                              ◉
                            </button>
                          </div>
                        </div>

                        <div className="poster-info">
                          <h3>{game.name}</h3>

                          <div className="poster-meta">
                            <span>⭐ 4.7</span>
                            <span className="genre">Action</span>
                          </div>

                          <div className="poster-actions">
                            <button
                              className="meter-button"
                              type="button"
                              onClick={() => openMeter(game)}
                            >
                              {accessible
                                ? "GamingVerse Meter"
                                : "🔒 Restricted"}
                            </button>

                            <button
                              className="details-button-small"
                              type="button"
                              onClick={() => openDetails(game)}
                            >
                              {accessible ? "Details" : "View Access"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {filteredHorizontal.length === 0 &&
                filteredPosters.length === 0 && (
                  <div className="no-results">
                    <div>🎮</div>
                    <h2>No games found</h2>
                    <p>Try searching for another game.</p>
                  </div>
                )}
            </section>
          </main>
        </>
      )}

      {(activeView === "trailers" ||
        activeView === "news" ||
        activeView === "clubs") && (
        <section className="trailers-page">
          <div className="trailers-layout">
            <aside className="trailers-sidebar">
              <div className="trailers-sidebar-title">EXPLORE</div>

              <button
                className={`trailers-side-item ${
                  activeView === "trailers" ? "active" : ""
                }`}
                type="button"
                onClick={() => {
                  setActiveView("trailers");
                  setSpacesSection("feed");
                  setSelectedClubId(null);
                }}
              >
                <span className="sidebar-nav-icon">⌂</span>
                <span>Feed</span>
              </button>

              <button
                className={`trailers-side-item ${
                  activeView === "news" ? "active" : ""
                }`}
                type="button"
                onClick={() => setActiveView("news")}
              >
                <span className="sidebar-nav-icon">▤</span>
                <span>News</span>
              </button>

              <button
                className={`trailers-side-item ${
                  activeView === "clubs" ? "active" : ""
                }`}
                type="button"
                onClick={() => {
                  setActiveView("clubs");
                  setSpacesSection("clubs");
                  setSelectedClubId(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="sidebar-nav-icon">♣</span>
                <span>Gaming Clubs</span>
              </button>
            </aside>

            {activeView === "news" ? (
              <main className="news-feed">
                <div className="news-feed-header">
                  <div>
                    <span className="section-label">LATEST GAMING NEWS</span>
                    <h1>Gaming News</h1>
                    <p>Fresh gaming headlines and industry updates.</p>
                  </div>
                  <button
                    type="button"
                    className={`news-date-pill ${newsLoading ? "is-loading" : ""}`}
                    onClick={fetchLiveGamingNews}
                    disabled={newsLoading}
                    title="Refresh live gaming news"
                  >
                    <span
                      className={
                        newsLoading ? "news-live-dot loading" : "news-live-dot"
                      }
                    >
                      ●
                    </span>
                    <span>
                      {newsLoading
                        ? "Updating live news..."
                        : newsUpdatedAt
                          ? `Live • Updated ${newsUpdatedAt.toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}`
                          : "Live news • Click to refresh"}
                    </span>
                    <span className="news-refresh-button" aria-hidden="true">
                      ↻
                    </span>
                  </button>

                  {newsError && (
                    <div className="news-live-note">{newsError}</div>
                  )}
                </div>

                <div className="news-layout">
                  <div className="news-main-grid">
                    {newsItems.slice(0, 6).map((news, index) => {
                      const game =
                        horizontalGames.find(
                          (item) =>
                            item.name.toLowerCase() ===
                            news.imageGame.toLowerCase(),
                        ) ||
                        horizontalGames[
                          index % Math.max(horizontalGames.length, 1)
                        ];

                      return (
                        <article
                          className={`news-card ${
                            index === 0 ? "featured" : ""
                          }`}
                          key={news.id}
                        >
                          <div className="news-card-image">
                            {(news.image || game?.image) && (
                              <img src={news.image || game.image} alt="" />
                            )}
                            <span className="news-card-tag">{news.tag}</span>
                          </div>

                          <div className="news-card-body">
                            <div className="news-source-row">
                              <span>{news.source}</span>
                              <span>•</span>
                              <span>{news.time}</span>
                            </div>

                            <h2>{news.title}</h2>
                            <p>{news.summary}</p>

                            <a
                              href={news.url}
                              target="_blank"
                              rel="noreferrer"
                              className="news-read-button"
                            >
                              Read News →
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <aside className="news-sidebar">
                    <div className="news-sidebar-title">
                      <span>⚡</span>
                      <h2>Top Stories</h2>
                    </div>

                    <div className="news-top-list">
                      {newsItems.slice(6, 8).map((news, index) => {
                        const game =
                          horizontalGames.find(
                            (item) =>
                              item.name.toLowerCase() ===
                              news.imageGame.toLowerCase(),
                          ) ||
                          horizontalGames[
                            (index + 6) % Math.max(horizontalGames.length, 1)
                          ];

                        return (
                          <a
                            key={news.id}
                            href={news.url}
                            target="_blank"
                            rel="noreferrer"
                            className="news-top-item"
                          >
                            {(news.image || game?.image) && (
                              <img src={news.image || game.image} alt="" />
                            )}
                            <span>
                              <small>{news.tag}</small>
                              <strong>{news.title}</strong>
                              <em>{news.time}</em>
                            </span>
                          </a>
                        );
                      })}
                    </div>

                    <div className="news-source-note">
                      <strong>
                        {liveNews.length ? "Live sources" : "Saved sources"}
                      </strong>
                      <p>
                        {liveNews.length
                          ? "Headlines are fetched automatically and refreshed every 10 minutes."
                          : "News links open the original publisher or reporting source."}
                      </p>
                    </div>
                  </aside>
                </div>
              </main>
            ) : activeView === "clubs" || spacesSection === "clubs" ? (
              <main className="clubs-feed">
                {selectedClubId &&
                  (() => {
                    const selectedClub = gamingClubs.find(
                      (club) => club.id === selectedClubId,
                    );
                    if (!selectedClub) return null;
                    const joined = joinedClubIds.includes(selectedClub.id);
                    const clubMembers =
                      selectedClub.members +
                      (joined && !selectedClub.membersAdded ? 1 : 0);
                    const clubDiscussionsForClub = clubDiscussions.filter(
                      (discussion) =>
                        !discussion.clubId ||
                        discussion.clubId === selectedClub.id,
                    );

                    return (
                      <section className="club-open-page">
                        <div
                          className="club-open-hero"
                          style={{ "--club-accent": selectedClub.accent }}
                        >
                          <div className="club-open-icon">♣</div>
                          <div className="club-open-heading">
                            <span>{selectedClub.interest}</span>
                            <h1>{selectedClub.name}</h1>
                          </div>
                          <button
                            type="button"
                            className="club-open-close"
                            onClick={closeClub}
                            aria-label="Close club"
                          >
                            ×
                          </button>
                        </div>

                        <div className="club-open-content">
                          <p className="club-open-description">
                            {selectedClub.description}
                          </p>

                          <div className="club-open-meta">
                            <span>♟ {clubMembers} members</span>
                            <span>● {selectedClub.interest}</span>
                            <span>{joined ? "✓ Joined" : "Not joined"}</span>
                          </div>

                          <section className="club-whatsapp-chat">
                            <header className="club-whatsapp-header">
                              <div className="club-whatsapp-avatar">♣</div>
                              <div className="club-whatsapp-title">
                                <strong>{selectedClub.name}</strong>
                                <span>
                                  {clubMembers} members •{" "}
                                  {joined ? "Online" : "View only"}
                                </span>
                              </div>
                              <div
                                className="club-whatsapp-actions"
                                aria-hidden="true"
                              >
                                <span>⌕</span>
                                <span>⋮</span>
                              </div>
                            </header>

                            <div className="club-whatsapp-messages">
                              <div className="club-chat-day">TODAY</div>
                              {clubDiscussionsForClub.length ? (
                                clubDiscussionsForClub
                                  .slice(0, 20)
                                  .map((discussion) => {
                                    const currentUserName =
                                      auth.currentUser?.displayName ||
                                      auth.currentUser?.email?.split("@")[0] ||
                                      "Gamer";
                                    const isMine =
                                      String(
                                        discussion.author || "",
                                      ).toLowerCase() ===
                                      String(currentUserName).toLowerCase();
                                    return (
                                      <div
                                        className={`club-chat-message-row ${isMine ? "mine" : "theirs"}`}
                                        key={discussion.id}
                                      >
                                        {!isMine && (
                                          <div className="club-chat-avatar">
                                            {(discussion.author || "G")
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                        )}
                                        <div className="club-chat-bubble">
                                          {!isMine && (
                                            <span className="club-chat-author">
                                              @{discussion.author || "Gamer"}
                                            </span>
                                          )}
                                          <p>{discussion.title}</p>
                                          <span className="club-chat-time">
                                            {String(
                                              discussion.meta || "Just now",
                                            )
                                              .split(" • ")[0]
                                              .replace(/^@[^ ]+\s*•\s*/i, "")}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                              ) : (
                                <div className="club-empty-state club-chat-empty">
                                  No messages yet. Start the conversation.
                                </div>
                              )}
                            </div>

                            {joined ? (
                              <form
                                className="club-whatsapp-composer"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  postClubDiscussion();
                                }}
                              >
                                <button
                                  type="button"
                                  className="club-chat-emoji"
                                  aria-label="Add emoji"
                                >
                                  ☺
                                </button>
                                <input
                                  value={clubPost}
                                  onChange={(event) =>
                                    setClubPost(event.target.value)
                                  }
                                  placeholder="Type a message"
                                  maxLength={140}
                                />
                                <button
                                  type="submit"
                                  className="club-chat-send"
                                  aria-label="Send message"
                                >
                                  ➤
                                </button>
                              </form>
                            ) : (
                              <div className="club-chat-join-note">
                                Join the club to send messages.
                              </div>
                            )}
                          </section>

                          <div className="club-open-footer">
                            <button
                              type="button"
                              className="club-open-back"
                              onClick={closeClub}
                            >
                              ← Back to Clubs
                            </button>

                            {joined && (
                              <button
                                type="button"
                                className="club-open-leave"
                                onClick={() => {
                                  setJoinedClubIds((current) => {
                                    const next = current.filter(
                                      (id) => id !== selectedClub.id,
                                    );
                                    localStorage.setItem(
                                      "gamingverse_joined_clubs",
                                      JSON.stringify(next),
                                    );
                                    return next;
                                  });
                                  closeClub();
                                }}
                              >
                                Leave Club
                              </button>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                {!selectedClubId && (
                  <>
                    <div className="clubs-feed-head">
                      <div>
                        <span className="section-label">COMMUNITY</span>
                        <h1>Gaming Clubs</h1>
                        <p>
                          Create and join gaming clubs, share gaming interests,
                          discuss your favourite games and meet other gamers.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="clubs-create-button"
                        onClick={() => setShowCreateClub((current) => !current)}
                      >
                        {showCreateClub ? "Close" : "+ Create Club"}
                      </button>
                    </div>

                    {showCreateClub && (
                      <section className="club-create-panel">
                        <div className="club-create-grid">
                          <label>
                            Club Name
                            <input
                              value={newClubName}
                              onChange={(event) =>
                                setNewClubName(event.target.value)
                              }
                              placeholder="e.g. Open World Legends"
                              maxLength={50}
                            />
                          </label>

                          <label>
                            Interest
                            <select
                              value={newClubInterest}
                              onChange={(event) =>
                                setNewClubInterest(event.target.value)
                              }
                            >
                              {[
                                "Action",
                                "Adventure",
                                "RPG",
                                "FPS",
                                "PlayStation",
                                "Xbox",
                                "PC",
                              ].map((interest) => (
                                <option key={interest} value={interest}>
                                  {interest}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label className="club-create-description">
                          Description
                          <textarea
                            value={newClubDescription}
                            onChange={(event) =>
                              setNewClubDescription(event.target.value)
                            }
                            placeholder="Tell gamers what your club is about..."
                            maxLength={180}
                          />
                        </label>

                        <button
                          type="button"
                          className="clubs-create-submit"
                          onClick={createGamingClub}
                        >
                          Create & Join Club
                        </button>
                      </section>
                    )}

                    <div className="clubs-toolbar">
                      <div className="club-interest-filters">
                        {[
                          "All",
                          "Action",
                          "Adventure",
                          "RPG",
                          "FPS",
                          "PlayStation",
                          "Xbox",
                          "PC",
                        ].map((interest) => (
                          <button
                            key={interest}
                            type="button"
                            className={
                              clubInterest === interest ? "active" : ""
                            }
                            onClick={() => setClubInterest(interest)}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>

                      <label className="club-search">
                        <span>⌕</span>
                        <input
                          value={clubSearch}
                          onChange={(event) =>
                            setClubSearch(event.target.value)
                          }
                          placeholder="Search clubs..."
                        />
                      </label>
                    </div>

                    <section className="clubs-block">
                      <div className="clubs-block-heading">
                        <div>
                          <span className="section-label">
                            FIND YOUR COMMUNITY
                          </span>
                          <h2>Clubs for Gamers</h2>
                        </div>
                        <span>{filteredGamingClubs.length} clubs</span>
                      </div>

                      <div className="clubs-grid">
                        {filteredGamingClubs.map((club) => {
                          const joined = joinedClubIds.includes(club.id);
                          return (
                            <article
                              className="gaming-club-card"
                              key={club.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openClub(club.id)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  openClub(club.id);
                                }
                              }}
                            >
                              <div
                                className="gaming-club-card-top"
                                style={{ "--club-accent": club.accent }}
                              >
                                <div className="gaming-club-icon">♣</div>
                                <span>{club.interest}</span>
                              </div>

                              <div className="gaming-club-card-body">
                                <h3>{club.name}</h3>
                                <p>{club.description}</p>

                                <div className="gaming-club-card-footer">
                                  <span>
                                    ♟{" "}
                                    {club.members +
                                      (joined && !club.membersAdded
                                        ? 1
                                        : 0)}{" "}
                                    members
                                  </span>
                                  <button
                                    type="button"
                                    className={joined ? "joined" : ""}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleClubMembership(club.id);
                                    }}
                                  >
                                    {joined ? "Joined ✓" : "Join Club"}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {!filteredGamingClubs.length && (
                        <div className="clubs-feature-note">
                          <strong>No clubs found</strong>
                          <span>Try another interest or search term.</span>
                        </div>
                      )}
                    </section>

                    <section className="community-chat-panel">
                      <div className="community-chat-header">
                        <div className="community-chat-avatar">💬</div>
                        <div>
                          <span className="section-label">COMMUNITY</span>
                          <h2>Community Talks</h2>
                          <p>GamingVerse community chat</p>
                        </div>
                        <span className="community-chat-online">● Online</span>
                      </div>

                      <div className="community-chat-messages">
                        {communityTalks.slice(0, 12).map((discussion) => {
                          const currentUser =
                            auth.currentUser?.displayName ||
                            auth.currentUser?.email?.split("@")[0] ||
                            "Gamer";
                          const isMine =
                            String(discussion.author || "")
                              .trim()
                              .toLowerCase() ===
                            currentUser.trim().toLowerCase();

                          return (
                            <article
                              className={`community-message ${isMine ? "mine" : ""}`}
                              key={discussion.id}
                            >
                              {!isMine && (
                                <div className="community-message-avatar">
                                  {(discussion.author || "G")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div className="community-message-bubble">
                                {!isMine && (
                                  <strong>
                                    @{discussion.author || "Gamer"}
                                  </strong>
                                )}
                                <div className="community-message-text">
                                  {discussion.title}
                                </div>
                                <span className="community-message-time">
                                  {
                                    String(discussion.meta || "Just now").split(
                                      " • ",
                                    )[0]
                                  }
                                </span>
                              </div>
                            </article>
                          );
                        })}

                        {!communityTalks.length && (
                          <div className="community-chat-empty">
                            <span>💬</span>
                            <strong>No messages yet</strong>
                            <p>
                              Start the conversation with the GamingVerse
                              community.
                            </p>
                          </div>
                        )}
                      </div>

                      <form
                        className="community-chat-composer"
                        onSubmit={(event) => {
                          event.preventDefault();
                          postCommunityTalk();
                        }}
                      >
                        <input
                          value={communityTalkPost}
                          onChange={(event) =>
                            setCommunityTalkPost(event.target.value)
                          }
                          placeholder="Type a message..."
                          maxLength={140}
                        />
                        <button type="submit" aria-label="Send message">
                          ➤
                        </button>
                      </form>
                    </section>

                    <div className="clubs-feature-note">
                      <strong>Gaming Clubs</strong>
                      <span>
                        Connect with other gamers based on shared interests and
                        participate in discussions.
                      </span>
                    </div>
                  </>
                )}
              </main>
            ) : (
              <main className="trailers-feed">
                <div className="trailers-feed-head">
                  <div>
                    <span className="section-label">WATCH NOW</span>
                    <h1>Latest Spaces</h1>
                    <p>
                      Discover new game reveals, gameplay footage and featured
                      gaming content.
                    </p>
                  </div>

                  <div className="trailers-search-pill">
                    <span>🔍</span>
                    <span>
                      {filteredHorizontal.slice(0, 8).length} trailers
                    </span>
                  </div>
                </div>

                <div className="trailers-list">
                  {filteredHorizontal.slice(0, 8).map((game, index) => {
                    const details = getGameDetails(game.name);
                    const trailerLink =
                      details.trailerUrl || details.trailerSearchUrl;
                    return (
                      <article
                        className="trailer-post"
                        key={`trailer-post-${game.name}-${index}`}
                      >
                        <a
                          className="trailer-media"
                          href={trailerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Watch ${game.name} trailer`}
                        >
                          <img src={game.image} alt={game.name} />
                          <span className="trailer-media-shade"></span>
                          <span className="trailer-play">▶</span>
                          <span className="trailer-media-label">TRAILER</span>
                        </a>

                        <div className="trailer-post-copy">
                          <h2>
                            Featured content for <strong>{game.name}</strong> is
                            here.
                          </h2>

                          <p>{details.description}</p>

                          <div className="trailer-post-meta">
                            <span>GamingVerse</span>
                            <span>•</span>
                            <span>Featured Game</span>
                          </div>
                        </div>

                        <div className="trailer-post-actions">
                          <a
                            className="trailer-watch-link"
                            href={trailerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Space ↗
                          </a>

                          <button
                            className="trailer-comment-button"
                            type="button"
                            onClick={() => openDetails(game)}
                            aria-label={`Open ${game.name}`}
                          >
                            ◌
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </main>
            )}

            <aside className="trailers-promo">
              <div className="trailers-promo-kicker">FEATURED</div>

              <div className="trailers-promo-card">
                {filteredPosters[0] ? (
                  <img
                    src={filteredPosters[0].image}
                    alt={filteredPosters[0].name}
                    className="trailers-promo-image"
                  />
                ) : null}

                <div className="trailers-promo-overlay"></div>

                <div className="trailers-promo-copy">
                  <span>GamingVerse Spotlight</span>
                  <h3>{filteredPosters[0]?.name || "Game Spotlight"}</h3>

                  <button
                    type="button"
                    onClick={() => {
                      if (filteredPosters[0]) {
                        openDetails(filteredPosters[0]);
                      }
                    }}
                  >
                    Open Game ↗
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}
      {/* ===================================================
            GAME DETAILS MODAL
        =================================================== */}

      {selectedGame && showDetails && (
        <div className="details-backdrop" onClick={closeDetails}>
          <section
            className="details-modal details-modal-reference"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="details-close"
              type="button"
              onClick={closeDetails}
              aria-label="Close details"
            >
              ×
            </button>

            {(() => {
              const details = getGameDetails(selectedGame.name);
              const trailerKey = normalizeTrailerGameName(selectedGame.name);
              const liveTrailerMedia = trailerMediaMap[trailerKey];
              const heroTrailerUrl =
                (liveTrailerMedia?.type === "youtube"
                  ? liveTrailerMedia.url
                  : "") ||
                getVerifiedTrailerUrl(selectedGame.name) ||
                String(
                  selectedGame?.trailerUrl ||
                    details.trailerUrl ||
                    getGameMediaFallback(selectedGame.name)?.trailer ||
                    "",
                ).trim();
              const heroYoutubeUrl = toYouTubeEmbedUrl(heroTrailerUrl);
              const heroTrailerId = extractYouTubeId(heroTrailerUrl);
              const heroThumbnailUrl = heroTrailerId
                ? `https://i.ytimg.com/vi/${heroTrailerId}/maxresdefault.jpg`
                : selectedGame?.heroImage ||
                  selectedGame?.image ||
                  getGameMediaFallback(selectedGame.name)?.hero ||
                  "";

              return (
                <>
                  <section className="reference-game-hero">
                    <div className="reference-game-hero-media">
                      <img
                        className="reference-game-hero-thumbnail-image"
                        src={
                          heroThumbnailUrl ||
                          selectedGame?.heroImage ||
                          selectedGame?.image ||
                          getGameMediaFallback(selectedGame.name)?.hero ||
                          ""
                        }
                        alt=""
                        aria-hidden="true"
                        onError={(event) => {
                          const fallbackImage =
                            selectedGame?.heroImage ||
                            selectedGame?.image ||
                            getGameMediaFallback(selectedGame.name)?.hero ||
                            "";
                          if (
                            fallbackImage &&
                            event.currentTarget.src !== fallbackImage
                          ) {
                            event.currentTarget.src = fallbackImage;
                          }
                        }}
                      />
                      <div className="reference-game-hero-thumbnail-shade" />

                      {/* Always show the trailer control on the game details hero.
                          openTrailer() resolves a verified/RAWG trailer when needed. */}
                      <button
                        className="reference-game-hero-play"
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openTrailer(selectedGame);
                        }}
                        aria-label={`Play ${details.title} trailer`}
                      >
                        ▶
                      </button>
                    </div>

                    <div className="reference-game-hero-scrim" />

                    <div className="reference-game-hero-content">
                      <div className="reference-game-hero-left">
                        <button
                          className="reference-game-hero-poster-button"
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            openPoster(selectedGame);
                          }}
                          aria-label={`View ${selectedGame.name} poster`}
                        >
                          <img
                            className="reference-game-hero-poster"
                            src={
                              selectedGame.image ||
                              getGameMediaFallback(selectedGame.name)?.poster ||
                              (() => {
                                const trailer =
                                  getVerifiedTrailerUrl(selectedGame.name) ||
                                  selectedGame.trailerUrl ||
                                  "";
                                const id = extractYouTubeId(trailer);
                                return id
                                  ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                                  : "";
                              })()
                            }
                            alt={selectedGame.name}
                            onError={(event) => {
                              const fallbackPoster =
                                getGameMediaFallback(selectedGame.name)
                                  ?.poster ||
                                (() => {
                                  const trailer =
                                    getVerifiedTrailerUrl(selectedGame.name) ||
                                    selectedGame.trailerUrl ||
                                    "";
                                  const id = extractYouTubeId(trailer);
                                  return id
                                    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                                    : "";
                                })();
                              if (
                                fallbackPoster &&
                                event.currentTarget.src !== fallbackPoster
                              ) {
                                event.currentTarget.src = fallbackPoster;
                              }
                            }}
                          />
                        </button>

                        <div className="reference-game-hero-copy">
                          <span className="reference-hero-eyebrow">
                            GAMINGVERSE GAME GUIDE
                          </span>
                          <h2>{details.title}</h2>
                          <p>{details.description}</p>

                          <div className="reference-hero-meta">
                            <span>🎯 {details.genre}</span>
                            <span>🎮 {details.platforms}</span>
                            <span>📅 {details.releaseDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="reference-hero-actions">
                        <button
                          className={`reference-watch-button ${
                            watchedGames.includes(selectedGame.name)
                              ? "is-active"
                              : ""
                          }`}
                          type="button"
                          onClick={toggleWatched}
                        >
                          👁{" "}
                          {watchedGames.includes(selectedGame.name)
                            ? "Marked as Played"
                            : "Mark as Played"}
                        </button>

                        <div className="reference-secondary-actions">
                          <button
                            className={`reference-utility-button ${
                              collectionGames.includes(selectedGame.name)
                                ? "is-active"
                                : ""
                            }`}
                            type="button"
                            onClick={toggleCollection}
                          >
                            ♧{" "}
                            {collectionGames.includes(selectedGame.name)
                              ? "In Collections"
                              : "Collections"}
                          </button>

                          <button
                            className={`reference-utility-button ${
                              watchLaterGames.includes(selectedGame.name)
                                ? "is-active"
                                : ""
                            }`}
                            type="button"
                            onClick={toggleWatchLater}
                          >
                            ◷{" "}
                            {watchLaterGames.includes(selectedGame.name)
                              ? "Saved for Later"
                              : "Watch Later"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="reference-content-grid">
                    <main className="reference-overview">
                      <div className="reference-overview-kicker">
                        GAME OVERVIEW
                      </div>
                      <h3>Overview</h3>
                      <p className="reference-overview-text">
                        {details.about || details.description}
                      </p>

                      <div className="reference-tags">
                        <span>{details.genre}</span>
                        <span>{details.platforms}</span>
                        <span>GamingVerse Guide</span>
                      </div>

                      <div className="reference-section-divider" />

                      <div className="reference-story-grid">
                        <section className="reference-text-card">
                          <h4>📖 Story</h4>
                          <p>
                            {details.story ||
                              "Explore the game's world, characters and story."}
                          </p>
                        </section>

                        <section className="reference-text-card">
                          <h4>🎮 Gameplay</h4>
                          <p>
                            {details.gameplay ||
                              "Experience the game's core gameplay, exploration and progression."}
                          </p>
                        </section>
                      </div>

                      {details.features?.length > 0 && (
                        <section className="reference-features">
                          <h4>✨ Key Features</h4>
                          <div className="reference-feature-list">
                            {details.features
                              .slice(0, 8)
                              .map((feature, index) => (
                                <span key={`${feature}-${index}`}>
                                  ✓ {feature}
                                </span>
                              ))}
                          </div>
                        </section>
                      )}
                    </main>

                    <aside className="reference-info-panel">
                      <h3>Game Info</h3>
                      <div className="reference-info-item">
                        <span>Genre</span>
                        <strong>{details.genre}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Platforms</span>
                        <strong>{details.platforms}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Release Date</span>
                        <strong>{details.releaseDate}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Developer</span>
                        <strong>{details.developer}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Publisher</span>
                        <strong>{details.publisher}</strong>
                      </div>
                    </aside>
                  </div>

                  <section
                    className="inline-gv-meter"
                    aria-label="GamingVerse Meter"
                  >
                    <div className="inline-gv-meter-heading">
                      <div>
                        <span className="inline-gv-meter-eyebrow">
                          GAMINGVERSE METER
                        </span>
                        <h3>GamingVerse Meter</h3>
                      </div>
                    </div>

                    <div className="inline-gv-meter-gauge-wrap">
                      <div className="inline-gv-meter-gauge">
                        <div
                          className="inline-gv-meter-arc"
                          style={{
                            background: `conic-gradient(
                              from 270deg,
                              #ef476f 0deg,
                              #ef476f ${Math.max(meterPercent * 1.8, 2)}deg,
                              #ffbd17 ${Math.max(meterPercent * 1.8, 2)}deg,
                              #ffbd17 180deg,
                              #0bd58f 180deg,
                              #0bd58f 360deg
                            )`,
                          }}
                        >
                          <div className="inline-gv-meter-inner">
                            <strong>{meterPercent}%</strong>
                            <span>
                              {totalVotes
                                ? `${top100FormatVotes(totalVotes)} Votes`
                                : "No votes yet"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="inline-gv-meter-breakdown">
                      <div className="inline-gv-meter-legend skip">
                        <span className="inline-gv-meter-dot" />
                        <span>Skip</span>
                        <strong>
                          {totalVotes
                            ? Math.round((reviewCounts.skip / totalVotes) * 100)
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="inline-gv-meter-legend timepass">
                        <span className="inline-gv-meter-dot" />
                        <span>Timepass</span>
                        <strong>
                          {totalVotes
                            ? Math.round(
                                (reviewCounts.timepass / totalVotes) * 100,
                              )
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="inline-gv-meter-legend go">
                        <span className="inline-gv-meter-dot" />
                        <span>Go for it</span>
                        <strong>
                          {totalVotes
                            ? Math.round(
                                (reviewCounts["go-for-it"] / totalVotes) * 100,
                              )
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="inline-gv-meter-legend perfection">
                        <span className="inline-gv-meter-dot" />
                        <span>Perfection</span>
                        <strong>
                          {totalVotes
                            ? Math.round(
                                (reviewCounts.perfection / totalVotes) * 100,
                              )
                            : 0}
                          %
                        </strong>
                      </div>
                    </div>

                    <div className="inline-gv-meter-divider" />

                    <section className="inline-gv-review-section">
                      <div className="inline-gv-review-heading">
                        <div>
                          <span>COMMUNITY</span>
                          <h4>Write a Review</h4>
                        </div>
                      </div>

                      <div className="community-review-box inline-gv-review-box">
                        <div className="community-review-top">
                          <div className="community-user">
                            <div className="community-avatar">
                              {(
                                auth.currentUser?.displayName
                                  ?.trim()
                                  ?.charAt(0) ||
                                auth.currentUser?.email?.charAt(0) ||
                                "G"
                              ).toUpperCase()}
                            </div>
                            <div>
                              <strong>
                                {auth.currentUser?.displayName ||
                                  auth.currentUser?.email?.split("@")[0] ||
                                  "Gamer"}
                              </strong>
                              <span>Share your experience</span>
                            </div>
                          </div>

                          <div
                            className="community-verdict-toggle"
                            role="group"
                            aria-label="Choose verdict"
                          >
                            {reviewOptions.map((option) => (
                              <button
                                key={`inline-composer-${option.id}`}
                                type="button"
                                className={
                                  composerVerdict === option.id
                                    ? `active ${option.id}`
                                    : option.id
                                }
                                onClick={() => setComposerVerdict(option.id)}
                              >
                                {option.title
                                  .replace("GO FOR IT", "Go for it")
                                  .replace("SKIP", "Skip")
                                  .replace("PERFECTION", "Perfection")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          className="community-review-input"
                          value={reviewText}
                          onChange={(e) =>
                            setReviewText(e.target.value.slice(0, 1000))
                          }
                          placeholder="Write your review here..."
                          maxLength={1000}
                        />

                        <div className="community-review-footer">
                          <span>{reviewText.length}/1000</span>
                          <button
                            type="button"
                            onClick={postCommunityReview}
                            disabled={!reviewText.trim() || reviewLoading}
                          >
                            {reviewLoading ? "Posting..." : "Post"}
                          </button>
                        </div>
                      </div>

                      {reviewMessage && (
                        <div className="meter-message inline-gv-message">
                          {reviewMessage}
                        </div>
                      )}

                      <div className="community-reviews-heading inline-gv-user-reviews-heading">
                        <h3>User Reviews</h3>
                        <div className="community-review-filters">
                          <button
                            type="button"
                            className="review-sort-button"
                            onClick={() =>
                              setReviewFilter(
                                reviewFilter === "Most Liked"
                                  ? "Newest"
                                  : "Most Liked",
                              )
                            }
                          >
                            ↕ {reviewFilter}⌄
                          </button>
                          <label>
                            <input
                              type="checkbox"
                              checked={showSpoilers}
                              onChange={(e) =>
                                setShowSpoilers(e.target.checked)
                              }
                            />
                            <span>Show Spoilers</span>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={followingOnly}
                              onChange={(e) =>
                                setFollowingOnly(e.target.checked)
                              }
                            />
                            <span>Following Only</span>
                          </label>
                        </div>
                      </div>

                      <div className="community-review-list">
                        {visibleCommunityReviews.length === 0 ? (
                          <div className="community-empty">
                            No user reviews yet. Be the first to share your
                            experience.
                          </div>
                        ) : (
                          visibleCommunityReviews.map((review) => {
                            const verdict = reviewOptions.find(
                              (option) => option.id === review.verdict,
                            );
                            return (
                              <article
                                className="community-review-card"
                                key={`inline-${review.id}`}
                              >
                                <div className="community-review-head">
                                  <div className="community-user">
                                    <div className="community-avatar">
                                      {review.initials}
                                    </div>
                                    <div>
                                      <strong>@{review.userName}</strong>
                                      <span>
                                        {formatReviewAge(review.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <span
                                    className={`community-verdict-pill ${review.verdict}`}
                                  >
                                    {verdict?.title
                                      ?.replace("GO FOR IT", "Go for it")
                                      .replace("SKIP", "Skip")
                                      .replace("PERFECTION", "Perfection") ||
                                      "Review"}
                                  </span>
                                </div>
                                <p
                                  className={
                                    review.spoilers && !showSpoilers
                                      ? "community-review-spoiler"
                                      : ""
                                  }
                                >
                                  {review.text}
                                </p>
                                <div className="community-review-actions">
                                  <button
                                    type="button"
                                    onClick={() => toggleReviewLike(review.id)}
                                  >
                                    ♥ {review.likes || 0}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReviewMessage(
                                        "Comments will be added next.",
                                      )
                                    }
                                  >
                                    ◯ {review.comments || 0}
                                  </button>
                                  <span className="community-more">•••</span>
                                </div>
                              </article>
                            );
                          })
                        )}
                      </div>
                    </section>
                  </section>
                </>
              );
            })()}
          </section>
        </div>
      )}
      {showPoster && selectedGame && (
        <div
          className="gv-poster-backdrop"
          onClick={closePoster}
          role="dialog"
          aria-modal="true"
          aria-label={`${getGameDetails(selectedGame.name).title} poster`}
        >
          <button
            className="gv-poster-close"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closePoster();
            }}
            aria-label="Close poster"
          >
            ×
          </button>
          <div
            className="gv-poster-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={
                selectedGame.image ||
                getGameMediaFallback(selectedGame.name)?.poster ||
                ""
              }
              alt={selectedGame.name}
              className="gv-poster-image"
              onError={(event) => {
                const fallbackPoster = getGameMediaFallback(
                  selectedGame.name,
                )?.poster;
                if (
                  fallbackPoster &&
                  event.currentTarget.src !== fallbackPoster
                ) {
                  event.currentTarget.src = fallbackPoster;
                }
              }}
            />
          </div>
        </div>
      )}

      {showTrailer && selectedGame && (
        <div className="gv-trailer-backdrop" onClick={closeTrailer}>
          <section
            className="gv-trailer-modal"
            onClick={(event) => event.stopPropagation()}
            aria-label={`${getGameDetails(selectedGame.name).title} trailer`}
          >
            <header className="gv-trailer-header">
              <div className="gv-trailer-heading">
                <span className="gv-trailer-eyebrow">GAMINGVERSE TRAILER</span>
                <h2>{getGameDetails(selectedGame.name).title}</h2>
                <span>Watch the trailer without leaving GamingVerse.</span>
              </div>
              <button
                className="gv-trailer-close"
                type="button"
                onClick={closeTrailer}
                aria-label="Close trailer"
              >
                ×
              </button>
            </header>

            <div className="gv-trailer-player-shell">
              {(() => {
                const gameName = String(selectedGame.name || "").trim();
                const fallbackTrailer =
                  getVerifiedTrailerUrl(gameName) ||
                  getGameDetails(gameName)?.trailerUrl ||
                  getGameMediaFallback(gameName)?.trailer ||
                  "";
                const trailerUrl = String(
                  selectedGame.trailerUrl || fallbackTrailer,
                ).trim();
                const youtubeId = extractYouTubeId(trailerUrl);
                const embedUrl = youtubeId
                  ? toYouTubeEmbedUrl(trailerUrl)
                  : trailerUrl;
                return selectedGame.trailerType === "video" && !youtubeId ? (
                  <video
                    className="gv-trailer-player"
                    src={embedUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                  />
                ) : embedUrl ? (
                  <iframe
                    key={embedUrl}
                    className="gv-trailer-player"
                    src={embedUrl}
                    title={`${getGameDetails(selectedGame.name).title} official trailer`}
                    allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="gv-trailer-empty">
                    <strong>Trailer not available in embedded playback.</strong>
                    <span>Use the YouTube button below to watch it.</span>
                  </div>
                );
              })()}
            </div>

            <div className="gv-trailer-footer">
              <div className="gv-trailer-footer-title">
                <strong>{getGameDetails(selectedGame.name).title}</strong>
                <span>Official Trailer</span>
              </div>
              <button
                type="button"
                className="gv-trailer-youtube-link"
                onClick={() => {
                  const id = extractYouTubeId(selectedGame.trailerUrl || "");
                  if (id) {
                    window.open(
                      `https://www.youtube.com/watch?v=${id}`,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }
                }}
              >
                ▶ YouTube
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================
            MARKETPLACE — SAME GAMES PAGE VIEW
        =================================================== */}
      {activeView === "marketplace" && <Marketplace embedded />}

      {/* ===================================================
            CAFÉ — SAME GAMES PAGE VIEW
        =================================================== */}
      {activeView === "cafe" && <Cafe embedded />}

      {/* ===================================================
            FOOTER
        =================================================== */}

      <footer className="games-footer">
        <div className="footer-brand">
          🎮 Gaming<span>Verse</span>
        </div>

        <p>© 2026 GamingVerse. All rights reserved.</p>
      </footer>
    </div>
  );
}
export default Games;
