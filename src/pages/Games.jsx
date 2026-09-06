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
import { onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { db, auth } from "../firebase";
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
  const genre = String(game?.genre || game?.genres || "").toLowerCase();
  if (genre.includes("racing")) return "Racing";
  if (genre.includes("sport")) return "Sports";
  if (genre.includes("rpg")) return "RPG";
  if (genre.includes("adventure")) return "Adventure";
  if (genre.includes("action")) return "Action";
  return "Other";
}

function matchesHomeCategory(game, category) {
  if (category === "All") return true;
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
const gameDetails = {
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

  return {
    id: `rawg-${game.id}`,
    rawgId: game.id,
    name: displayName,
    image: game.background_image || "",
    ageRating,
    genre,
    rating: Number.isFinite(Number(game?.rating)) ? Number(game.rating) : 0,
    releaseDate: game?.released || "",
    platforms: platformNames.length
      ? platformNames.join(" • ")
      : "PC • Console",
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

const DEFAULT_CLUB_EVENTS = [
  {
    id: "club-event-1",
    title: "Friday Night FPS",
    meta: "Friday • 8:00 PM • 16 gamers",
  },
  {
    id: "club-event-2",
    title: "PS5 Co-op Session",
    meta: "Saturday • 7:30 PM • 11 gamers",
  },
  {
    id: "club-event-3",
    title: "PC Gaming Community Night",
    meta: "Sunday • 6:00 PM • 24 gamers",
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
  const details = gameDetails[gameName] ||
    automaticGameDetailsCache[gameName] || {
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
  const trailerSearchUrl =
    details.trailerSearchUrl ||
    rich.trailerSearchUrl ||
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details.title || gameName} official trailer`)}`;
  return {
    ...details,
    ...rich,
    trailerSearchUrl,
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

function Games() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState("home");
  const [showAllAutomaticGames, setShowAllAutomaticGames] = useState(false);

  useEffect(() => {
    const view = searchParams.get("view");
    setActiveView(
      view === "collections"
        ? "collections"
        : view === "spaces" || view === "clubs"
          ? "trailers"
          : "home",
    );
    if (view === "clubs") {
      setSpacesSection("clubs");
    } else if (view === "spaces") {
      setSpacesSection("feed");
    }
  }, [searchParams]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [spacesSection, setSpacesSection] = useState("feed");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
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
  const [joinedEventIds, setJoinedEventIds] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_club_events") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
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
       AUTOMATIC GAME CATALOGUE
       Fetches 500+ current PC / PlayStation / Xbox games from RAWG.
     ======================================================= */
  useEffect(() => {
    let cancelled = false;

    const fetchAutomaticGames = async () => {
      if (!RAWG_API_KEY || RAWG_API_KEY === "PASTE_RAWG_API_KEY_HERE") {
        setAutomaticGames([]);
        setAutomaticGamesLoading(false);
        setAutomaticGamesError(
          "Add your RAWG API key in Games.jsx to enable automatic games.",
        );
        return;
      }

      try {
        setAutomaticGamesLoading(true);
        setAutomaticGamesError("");

        const today = new Date();
        const endDate = today.toISOString().slice(0, 10);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        const startDateValue = startDate.toISOString().slice(0, 10);

        /*
         * Load enough RAWG pages to build a real 500+ game catalogue.
         * RAWG returns a maximum of 40 games per page here, so we keep
         * requesting pages until we have at least 600 safe/allowed games
         * (or the API runs out of pages).
         */
        const TARGET_GAMES = 600;
        const PAGE_SIZE = 40;
        const MAX_PAGES = 20;
        const seen = new Set();
        const allResults = [];

        for (
          let page = 1;
          page <= MAX_PAGES && allResults.length < TARGET_GAMES;
          page += 1
        ) {
          const endpoint =
            `https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_API_KEY)}` +
            `&dates=${startDateValue},${endDate}` +
            `&ordering=-released` +
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

          pageResults
            .filter((game) => game?.name && game?.background_image)
            .filter(rawgGameHasAllowedPlatform)
            .filter(rawgGameIsSafe)
            .map(mapRawgGame)
            .filter((game) => {
              const key = game.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();

              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .filter((game) => !isBlockedGame(game))
            .forEach((game) => allResults.push(game));

          if (pageResults.length < PAGE_SIZE) break;
        }

        const mapped = allResults;

        mapped.forEach((game) => {
          automaticGameDetailsCache[game.name] = {
            title: game.name,
            description: `Automatically added to GamingVerse from the live game catalogue. Discover ${game.name}, its platforms, release information and community verdict.`,
            genre: game.genre,
            platforms: game.platforms,
            releaseDate: game.releaseDate || "—",
            developer: "—",
            publisher: "—",
            trailerUrl: "",
          };
          gameAgeRatings[game.name] = game.ageRating;
        });

        if (!cancelled) {
          setAutomaticGames(mapped);
        }
      } catch (error) {
        console.error("Automatic games error:", error);
        if (!cancelled) {
          setAutomaticGames([]);
          setAutomaticGamesError(
            "Automatic game refresh failed. Your saved GamingVerse games are still available.",
          );
        }
      } finally {
        if (!cancelled) setAutomaticGamesLoading(false);
      }
    };

    fetchAutomaticGames();

    // Refresh once per 30 minutes so newly released games can appear automatically.
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
  const toggleClubMembership = (clubId) => {
    setJoinedClubIds((current) => {
      const next = current.includes(clubId)
        ? current.filter((id) => id !== clubId)
        : [...current, clubId];
      localStorage.setItem("gamingverse_joined_clubs", JSON.stringify(next));
      return next;
    });
  };

  const createGamingClub = () => {
    const name = newClubName.trim();
    const description = newClubDescription.trim();

    if (!name || !description) {
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
      clubId: joinedClubIds[0] || "action-adventure",
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

  const toggleClubEvent = (eventId) => {
    setJoinedEventIds((current) => {
      const next = current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId];
      localStorage.setItem("gamingverse_club_events", JSON.stringify(next));
      return next;
    });
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
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  const filteredPosters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posterGames.filter(
      (game) =>
        game.name.toLowerCase().includes(query) &&
        matchesHomeCategory(game, activeCategory),
    );
  }, [search, activeCategory]);

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

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const combined = [...automaticGames, ...horizontalGames, ...posterGames];
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
    if (!canAccessGame(game, userAge)) {
      handleRestrictedGame(game);
      return;
    }

    setSelectedGame(game);
    setShowDetails(false);
    setReviewMessage("");
  };

  const openDetails = (game) => {
    if (!canAccessGame(game, userAge)) {
      handleRestrictedGame(game);
      return;
    }

    setSelectedGame(game);
    setShowDetails(true);
    setReviewMessage("");
    setSelectedReview(null);
  };
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedGame(null);
    setReviewMessage("");
    setSelectedReview(null);
  };
  const openTrailer = (game) => {
    if (!canAccessGame(game, userAge)) {
      handleRestrictedGame(game);
      return;
    }

    const trailer = getGameDetails(game?.name || "").trailerUrl;

    if (!trailer) {
      setReviewMessage("Trailer unavailable for this game.");
      return;
    }

    setSelectedGame(game);
    setShowDetails(false);
    setShowTrailer(true);
    setReviewMessage("");
  };

  const closeTrailer = () => {
    setShowTrailer(false);
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

  const scrollToCollections = () => {
    window.setTimeout(() => {
      document
        .querySelector(".collections-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  return (
    <div className="games-page">
      {/* ===================================================
            NAVBAR
        =================================================== */}

      <header className="games-navbar">
        <div className="brand">
          <div className="brand-icon">🎮</div>

          <div>
            <h2>
              Gaming<span>Verse</span>
            </h2>

            <small>Level up your gaming experience</small>
          </div>
        </div>

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
              activeView === "home" && activeCategory === "New" ? "active" : ""
            }`}
            title="New Releases"
            aria-label="New Releases"
            onClick={() => {
              setActiveView("home");
              setActiveCategory("New");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <GVIcon name="calendar" />
            <span className="nav-icon-label">New Releases</span>
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
            className="nav-icon-link marketplace-nav-button"
            type="button"
            title="CD Marketplace"
            aria-label="CD Marketplace"
            onClick={() => navigate("/marketplace")}
          >
            <GVIcon name="cart" />
            <span className="nav-icon-label">Marketplace</span>
          </button>

          {/* GAMING CAFÉ BOOKING */}
          <button
            className="nav-icon-link cafe-nav-button"
            type="button"
            title="Gaming Café Booking"
            aria-label="Gaming Café Booking"
            onClick={() => navigate("/cafe")}
          >
            <span className="cafe-navbar-icon" aria-hidden="true">
              🎮
            </span>
            <span className="nav-icon-label">Café</span>
          </button>

          <button
            className={`nav-icon-link nav-collections-button ${
              activeView === "collections" ? "active" : ""
            }`}
            type="button"
            title="Collections"
            aria-label="Collections"
            onClick={() => {
              setActiveView("collections");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <GVIcon name="bookmark" />
            <span className="nav-icon-label">Collections</span>
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
                <span className="notification-dot"></span>
              </button>

              <button
                type="button"
                className={`navbar-icon-button ${showProfileMenu ? "active" : ""}`}
                onClick={() => {
                  setShowProfileMenu((current) => !current);
                  setShowNotifications(false);
                }}
                aria-label="Profile menu"
                aria-expanded={showProfileMenu}
              >
                <span className="profile-avatar profile-avatar-button">
                  <GVIcon name="user" size={20} />
                </span>
              </button>
            </div>

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
                  {notificationTab === "all" && (
                    <>
                      <div className="notification-period">Last 30 Days</div>

                      <div className="notification-item">
                        <div className="notification-avatar">G</div>
                        <div className="notification-copy">
                          <strong>Gamer community</strong>
                          <p>New game recommendations are waiting for you.</p>
                          <span>Recently</span>
                        </div>
                      </div>

                      <div className="notification-item">
                        <div className="notification-avatar purple">★</div>
                        <div className="notification-copy">
                          <strong>GamingVerse</strong>
                          <p>
                            Your saved games and Play Later list were updated.
                          </p>
                          <span>Recently</span>
                        </div>
                      </div>
                    </>
                  )}

                  {notificationTab === "updates" && (
                    <div className="notification-empty-state">
                      <span>✦</span>
                      <strong>No new updates</strong>
                      <p>You are all caught up.</p>
                    </div>
                  )}

                  {notificationTab === "activity" && (
                    <div className="notification-empty-state">
                      <span>◌</span>
                      <strong>No recent activity</strong>
                      <p>Your latest activity will appear here.</p>
                    </div>
                  )}
                </div>

                <div className="notification-footer">
                  Notifications are automatically removed after 30 days
                </div>
              </div>
            )}

            {showProfileMenu && (
              <div className="navbar-popover profile-popover">
                <div className="profile-popover-head">
                  <span className="profile-avatar">A</span>
                  <div>
                    <strong>Gamer</strong>
                    <span>Online</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/profile");
                  }}
                >
                  👤 Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActiveView("collections");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  ♧ My Library
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  ⚙ Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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
                    onClick={() => setActiveCategory("All")}
                  >
                    View All →
                  </button>
                </div>
              </div>

              <div className="horizontal-grid">
                {filteredHorizontal
                  .filter((game) => !containsBlockedGameTerm(game.name))
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
                          <div className="automatic-game-footer">
                            <span>{game.releaseDate || "Release TBA"}</span>
                            <button
                              type="button"
                              className="details-button-small"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetails(game);
                              }}
                            >
                              {accessible ? "Details" : "View Access"}
                            </button>
                          </div>
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

              <div className="rawg-attribution">
                Automatic game data & images provided by{" "}
                <a href="https://rawg.io/" target="_blank" rel="noreferrer">
                  RAWG
                </a>
                .
              </div>
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
                  onClick={() => setActiveCategory("All")}
                >
                  View All →
                </button>
              </div>

              <div className="poster-grid">
                {filteredPosters
                  .filter((game) => !containsBlockedGameTerm(game.name))
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
                          <img src={game.image} alt={game.name} />

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

      {activeView === "collections" && (
        <section className="collections-hub">
          <div className="collections-hub-header">
            <div>
              <span className="section-label">YOUR LIBRARY</span>
              <h1>Collections</h1>
              <p>
                Everything you save is organized here so you can find it
                quickly.
              </p>
            </div>
          </div>

          <div className="collections-three-column">
            {/* COLLECTIONS */}
            <section className="collection-library-panel">
              <div className="collection-library-heading">
                <div>
                  <span className="section-label">SAVED</span>
                  <h2>Collections</h2>
                </div>
                <span>{collectionGames.length}</span>
              </div>

              {collectionGames.length > 0 ? (
                <div className="collection-library-list">
                  {collectionGames.map((gameName) => {
                    const game =
                      automaticGames.find((item) => item.name === gameName) ||
                      horizontalGames.find((item) => item.name === gameName) ||
                      posterGames.find((item) => item.name === gameName);
                    if (!game) return null;
                    return (
                      <button
                        type="button"
                        className="collection-library-item"
                        key={`collection-${gameName}`}
                        onClick={() => openDetails(game)}
                      >
                        <img src={game.image} alt={game.name} />
                        <span>
                          <strong>{game.name}</strong>
                          <small>Saved to collection</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="collection-library-empty">
                  <span>♧</span>
                  <strong>No saved games</strong>
                  <small>Use Collections on any game to add it here.</small>
                </div>
              )}
            </section>

            {/* WATCHED */}
            <section className="collection-library-panel watched-panel">
              <div className="collection-library-heading">
                <div>
                  <span className="section-label">HISTORY</span>
                  <h2>Marked as Watched</h2>
                </div>
                <span>{watchedGames.length}</span>
              </div>

              {watchedGames.length > 0 ? (
                <div className="collection-library-list">
                  {watchedGames.map((gameName) => {
                    const game =
                      automaticGames.find((item) => item.name === gameName) ||
                      horizontalGames.find((item) => item.name === gameName) ||
                      posterGames.find((item) => item.name === gameName);
                    if (!game) return null;
                    return (
                      <button
                        type="button"
                        className="collection-library-item"
                        key={`watched-${gameName}`}
                        onClick={() => openDetails(game)}
                      >
                        <img src={game.image} alt={game.name} />
                        <span>
                          <strong>{game.name}</strong>
                          <small>Marked as watched</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="collection-library-empty">
                  <span>✓</span>
                  <strong>No watched games</strong>
                  <small>Use Mark as watched from a game's details.</small>
                </div>
              )}
            </section>

            {/* PLAY LATER */}
            <section className="collection-library-panel later-panel">
              <div className="collection-library-heading">
                <div>
                  <span className="section-label">UP NEXT</span>
                  <h2>Play Later</h2>
                </div>
                <span>{watchLaterGames.length}</span>
              </div>

              {watchLaterGames.length > 0 ? (
                <div className="collection-library-list">
                  {watchLaterGames.map((gameName) => {
                    const game =
                      automaticGames.find((item) => item.name === gameName) ||
                      horizontalGames.find((item) => item.name === gameName) ||
                      posterGames.find((item) => item.name === gameName);
                    if (!game) return null;
                    return (
                      <button
                        type="button"
                        className="collection-library-item"
                        key={`later-${gameName}`}
                        onClick={() => openDetails(game)}
                      >
                        <img src={game.image} alt={game.name} />
                        <span>
                          <strong>{game.name}</strong>
                          <small>Saved for later</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="collection-library-empty">
                  <span>◷</span>
                  <strong>No games for later</strong>
                  <small>Use Play Later on a game you want to return to.</small>
                </div>
              )}
            </section>
          </div>
        </section>
      )}

      {(activeView === "trailers" || activeView === "news") && (
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
                  spacesSection === "clubs" && activeView === "trailers"
                    ? "active"
                    : ""
                }`}
                type="button"
                onClick={() => {
                  setActiveView("trailers");
                  setSpacesSection("clubs");
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
            ) : spacesSection === "clubs" ? (
              <main className="clubs-feed">
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
                        className={clubInterest === interest ? "active" : ""}
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
                      onChange={(event) => setClubSearch(event.target.value)}
                      placeholder="Search clubs..."
                    />
                  </label>
                </div>

                <section className="clubs-block">
                  <div className="clubs-block-heading">
                    <div>
                      <span className="section-label">FIND YOUR COMMUNITY</span>
                      <h2>Clubs for Gamers</h2>
                    </div>
                    <span>{filteredGamingClubs.length} clubs</span>
                  </div>

                  <div className="clubs-grid">
                    {filteredGamingClubs.map((club) => {
                      const joined = joinedClubIds.includes(club.id);
                      return (
                        <article className="gaming-club-card" key={club.id}>
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
                                  (joined && !club.membersAdded ? 1 : 0)}{" "}
                                members
                              </span>
                              <button
                                type="button"
                                className={joined ? "joined" : ""}
                                onClick={() => toggleClubMembership(club.id)}
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

                <div className="clubs-two-column">
                  <section className="club-panel">
                    <div className="club-panel-heading">
                      <div>
                        <span className="section-label">DISCUSSIONS</span>
                        <h2>Community Talks</h2>
                      </div>
                      <span>💬</span>
                    </div>

                    <div className="club-post-row">
                      <input
                        value={clubPost}
                        onChange={(event) => setClubPost(event.target.value)}
                        placeholder="Start a discussion..."
                        maxLength={140}
                      />
                      <button type="button" onClick={postClubDiscussion}>
                        Post
                      </button>
                    </div>

                    <div className="club-discussions-list">
                      {clubDiscussions.slice(0, 6).map((discussion) => (
                        <article
                          className="club-discussion-item"
                          key={discussion.id}
                        >
                          <div className="club-discussion-avatar">
                            {(discussion.author || "G").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{discussion.title}</strong>
                            <span>
                              @{discussion.author} • {discussion.meta}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="club-panel">
                    <div className="club-panel-heading">
                      <div>
                        <span className="section-label">EVENTS</span>
                        <h2>Gaming Events</h2>
                      </div>
                      <span>▦</span>
                    </div>

                    <div className="club-events-list">
                      {DEFAULT_CLUB_EVENTS.map((event) => {
                        const going = joinedEventIds.includes(event.id);
                        return (
                          <div className="club-event-item" key={event.id}>
                            <div className="club-event-icon">🎮</div>
                            <div>
                              <strong>{event.title}</strong>
                              <span>{event.meta}</span>
                            </div>
                            <button
                              type="button"
                              className={going ? "joined" : ""}
                              onClick={() => toggleClubEvent(event.id)}
                            >
                              {going ? "Going ✓" : "Join"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <div className="clubs-feature-note">
                  <strong>Gaming Clubs</strong>
                  <span>
                    Connect with other gamers based on shared interests,
                    participate in discussions and join gaming events.
                  </span>
                </div>
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
              return (
                <>
                  {/* Compact game header inspired by the reference layout */}
                  <div className="reference-game-header">
                    <img
                      className="reference-game-poster"
                      src={selectedGame.image}
                      alt={selectedGame.name}
                    />

                    <div className="reference-game-header-content">
                      <span className="reference-eyebrow">
                        GAMINGVERSE GAME GUIDE
                      </span>

                      <h2>{details.title}</h2>

                      <p className="reference-tagline">{details.description}</p>

                      <div className="reference-meta-row">
                        <span>🎯 {details.genre}</span>
                        <span>🎮 {details.platforms}</span>
                        <span>📅 {details.releaseDate}</span>
                      </div>

                      <div className="reference-actions reference-actions-stack">
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
                            ? "Marked as watched"
                            : "Mark as watched"}
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
                              : "Play Later"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="reference-actions-side">
                      <button
                        className="primary-detail-action"
                        type="button"
                        onClick={() => {
                          openMeter(selectedGame);
                        }}
                      >
                        💜 GamingVerse Meter
                      </button>

                      {details.trailerUrl ? (
                        <button
                          className="secondary-detail-action"
                          type="button"
                          onClick={() => openTrailer(selectedGame)}
                        >
                          ▶ Watch Trailer
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="reference-divider" />

                  {/* Main content area */}
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

                  {details.trailerUrl && (
                    <div className="reference-trailer">
                      <h3>Official Trailer</h3>
                      <div className="trailer-frame">
                        <iframe
                          src={details.trailerUrl}
                          title={`${details.title} official trailer`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        </div>
      )}

      {/* ===================================================
            YOUTUBE TRAILER MODAL
        =================================================== */}
      {showTrailer && selectedGame && (
        <div className="game-trailer-backdrop" onClick={closeTrailer}>
          <section
            className="game-trailer-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${getGameDetails(selectedGame.name).title} trailer`}
          >
            <div className="game-trailer-header">
              <div>
                <span className="game-trailer-kicker">OFFICIAL TRAILER</span>
                <h2>{getGameDetails(selectedGame.name).title}</h2>
                <p>Watch the trailer without leaving GamingVerse.</p>
              </div>

              <button
                className="game-trailer-close"
                type="button"
                onClick={closeTrailer}
                aria-label="Close trailer"
              >
                ×
              </button>
            </div>

            <div className="game-trailer-frame">
              <iframe
                src={`${getGameDetails(selectedGame.name).trailerUrl}?rel=0&modestbranding=1`}
                title={`${getGameDetails(selectedGame.name).title} official trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="game-trailer-footer">
              <div>
                <strong>{getGameDetails(selectedGame.name).title}</strong>
                <span>Official trailer • YouTube</span>
              </div>

              <a
                href={getGameDetails(selectedGame.name).trailerUrl.replace(
                  "https://www.youtube.com/embed/",
                  "https://www.youtube.com/watch?v=",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="game-trailer-youtube"
              >
                Open on YouTube ↗
              </a>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================
            GAMINGVERSE METER MODAL
        =================================================== */}

      {selectedGame && !showDetails && (
        <div className="meter-backdrop" onClick={closeMeter}>
          <section className="meter-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="meter-close"
              type="button"
              onClick={closeMeter}
              disabled={reviewLoading}
              aria-label="Close"
            >
              ×
            </button>
            <div className="meter-game-header">
              <img src={selectedGame.image} alt={selectedGame.name} />

              <div>
                <span className="meter-eyebrow">GAMINGVERSE REVIEW</span>

                <h2>{selectedGame.name}</h2>

                <p>Community verdict from GamingVerse players</p>
              </div>
            </div>
            {/* METER */}
            <div className="meter-section">
              <h3>GamingVerse Meter</h3>

              <div className="meter-gauge">
                <div
                  className="meter-arc"
                  style={{
                    background: `conic-gradient(
                      from 270deg,
                      #ef476f 0deg,
                      #ef476f ${Math.max(meterPercent * 1.8, 2)}deg,
                      #ffd166 ${Math.max(meterPercent * 1.8, 2)}deg,
                      #ffd166 180deg,
                      #0bd58f 180deg,
                      #0bd58f 360deg
                    )`,
                  }}
                >
                  <div className="meter-inner">
                    <strong>{meterPercent}%</strong>
                    <span>{meterText}</span>
                  </div>
                </div>
              </div>

              {/* VOTE BREAKDOWN */}
              <div className="meter-breakdown">
                <div className="meter-legend-item skip">
                  <span className="legend-dot"></span>
                  <span>Skip</span>
                  <strong>
                    {totalVotes
                      ? Math.round((reviewCounts.skip / totalVotes) * 100)
                      : 0}
                    %
                  </strong>
                </div>

                <div className="meter-legend-item timepass">
                  <span className="legend-dot"></span>
                  <span>Timepass</span>
                  <strong>
                    {totalVotes
                      ? Math.round((reviewCounts.timepass / totalVotes) * 100)
                      : 0}
                    %
                  </strong>
                </div>

                <div className="meter-legend-item go">
                  <span className="legend-dot"></span>
                  <span>Go For It</span>
                  <strong>
                    {totalVotes
                      ? Math.round(
                          (reviewCounts["go-for-it"] / totalVotes) * 100,
                        )
                      : 0}
                    %
                  </strong>
                </div>

                <div className="meter-legend-item perfection">
                  <span className="legend-dot"></span>
                  <span>Perfection</span>
                  <strong>
                    {totalVotes
                      ? Math.round((reviewCounts.perfection / totalVotes) * 100)
                      : 0}
                    %
                  </strong>
                </div>
              </div>

              {/* ===================================================
                WRITE A REVIEW + USER REVIEWS
                =================================================== */}
              <section className="community-review-section">
                <div className="community-review-heading">
                  <div>
                    <span className="community-review-eyebrow">COMMUNITY</span>
                    <h3>Write a Review</h3>
                  </div>

                  <div className="community-review-summary">
                    <span>
                      <span className="community-dot skip"></span>
                      Skip
                    </span>
                    <span>
                      <span className="community-dot timepass"></span>
                      Timepass
                    </span>
                    <span>
                      <span className="community-dot go-for-it"></span>
                      Go for it
                    </span>
                    <span>
                      <span className="community-dot perfection"></span>
                      Perfection
                    </span>
                  </div>
                </div>

                <div className="community-review-box">
                  <div className="community-review-top">
                    <div className="community-user">
                      <div className="community-avatar">
                        {(
                          auth.currentUser?.displayName?.trim()?.charAt(0) ||
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
                          key={`composer-${option.id}`}
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
                  <div className="meter-message">{reviewMessage}</div>
                )}

                <div className="community-reviews-heading">
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
                        onChange={(e) => setShowSpoilers(e.target.checked)}
                      />
                      <span>Show Spoilers</span>
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={followingOnly}
                        onChange={(e) => setFollowingOnly(e.target.checked)}
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
                          key={review.id}
                        >
                          <div className="community-review-head">
                            <div className="community-user">
                              <div className="community-avatar">
                                {review.initials}
                              </div>

                              <div>
                                <strong>@{review.userName}</strong>
                                <span>{formatReviewAge(review.createdAt)}</span>
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
                              {likedReviewIds.includes(review.id) ? "♥" : "♡"}{" "}
                              {review.likes || 0}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setReviewMessage("Comments will be added next.")
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
            </div>
          </section>
        </div>
      )}

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
