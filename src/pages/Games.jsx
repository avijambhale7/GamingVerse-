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
const horizontalGames = Object.entries(horizontalImages).map(
  ([path, image]) => ({
    name: getGameName(path),
    image,
  }),
);
const posterGames = Object.entries(posterImages).map(([path, image]) => ({
  name: getGameName(path),
  image,
}));
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
  const details = gameDetails[gameName] || {
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
   HOME CATEGORY FILTER
   ========================================================= */
function getGameCategory(gameName) {
  const categoryMap = {
    "GTA V": "Action",
    "Cyberpunk 2077": "RPG",
    "Assassin's Creed Shadows": "Action",
    "Among Us": "Adventure",
    "Black Myth Wukong": "RPG",
    "Counter Strike 2": "Action",
    "Ghost of Tsushima": "Adventure",
    "GTA VI": "Action",
    "God of War Ragnarok": "Adventure",
    "God of War": "Adventure",
    "Hogwarts Legacy": "RPG",
    Minecraft: "Adventure",
  };

  if (categoryMap[gameName]) {
    return categoryMap[gameName];
  }

  const genre = String(getGameDetails(gameName).genre || "").toLowerCase();

  if (genre.includes("racing")) return "Racing";
  if (genre.includes("sports")) return "Sports";
  if (genre.includes("rpg")) return "RPG";
  if (genre.includes("adventure")) return "Adventure";
  if (genre.includes("action")) return "Action";

  return "Action";
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

  useEffect(() => {
    const view = searchParams.get("view");
    setActiveView(
      view === "collections"
        ? "collections"
        : view === "spaces"
          ? "trailers"
          : "home",
    );
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
  const filterGamesByCategory = (games) => {
    const searched = games.filter((game) =>
      game.name.toLowerCase().includes(search.toLowerCase()),
    );

    if (
      activeCategory !== "All" &&
      activeCategory !== "Popular" &&
      activeCategory !== "New"
    ) {
      return searched.filter(
        (game) => getGameCategory(game.name) === activeCategory,
      );
    }

    if (activeCategory === "Popular") {
      return searched.slice(0, 12);
    }

    if (activeCategory === "New") {
      return searched.slice(-12);
    }

    return searched;
  };

  const filteredPosters = useMemo(
    () => filterGamesByCategory(posterGames),
    [search, activeCategory],
  );

  const filteredHorizontal = useMemo(
    () => filterGamesByCategory(horizontalGames),
    [search, activeCategory],
  );
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const combined = [...horizontalGames, ...posterGames];
    const seen = new Set();

    return combined.filter((game) => {
      const key = game.name.toLowerCase();

      if (seen.has(key) || !key.includes(query)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [search]);

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
  const openMeter = (game) => {
    setSelectedGame(game);
    setShowDetails(false);
    setReviewMessage("");
  };
  const openDetails = (game) => {
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
            <div className="home-category-toolbar">
              <div className="home-category-copy">
                <span className="home-category-label">BROWSE BY GENRE</span>
                <strong>
                  {activeCategory === "All"
                    ? "All Games"
                    : `${activeCategory} Games`}
                </strong>
                <span>
                  {filteredPosters.length} games available
                </span>
              </div>

              <div className="home-category-select-wrap">
                <label htmlFor="home-game-category">
                  Category
                </label>
                <select
                  id="home-game-category"
                  value={
                    ["All", "Action", "Adventure", "RPG", "Racing", "Sports"].includes(
                      activeCategory,
                    )
                      ? activeCategory
                      : "All"
                  }
                  onChange={(e) => {
                    setActiveView("home");
                    setActiveCategory(e.target.value);
                    window.setTimeout(() => {
                      document
                        .querySelector(".games-content")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }, 0);
                  }}
                  aria-label="Filter games by category"
                >
                  <option value="All">All Categories</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="RPG">RPG</option>
                  <option value="Racing">Racing</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
            </div>

            <section className="game-section">
              <div className="section-heading">
                <div>
                  <span className="section-label">DISCOVER</span>
                  <h2>Featured Games</h2>
                </div>

                <button
                  className="view-all"
                  type="button"
                  onClick={() => setActiveCategory("All")}
                >
                  View All →
                </button>
              </div>

              <div className="horizontal-grid">
                {filteredHorizontal.map((game, index) => (
                  <div
                    className="horizontal-card"
                    key={`${game.name}-${index}`}
                    onClick={() => openDetails(game)}
                  >
                    <img src={game.image} alt={game.name} />

                    <div className="card-gradient"></div>

                    <div className="horizontal-info">
                      <h3>{game.name}</h3>

                      <div className="game-meta">
                        <span>⭐ 4.8</span>
                        <span>🎮 {getGameCategory(game.name)}</span>
                      </div>

                      <button
                        className="card-details-button"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(game);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
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
                {filteredPosters.map((game, index) => (
                  <div className="poster-card" key={`${game.name}-${index}`}>
                    <div
                      className="poster-image-wrapper"
                      onClick={() => openDetails(game)}
                    >
                      <img src={game.image} alt={game.name} />

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
                          GamingVerse Meter
                        </button>

                        <button
                          className="details-button-small"
                          type="button"
                          onClick={() => openDetails(game)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
            </aside>

            {activeView === "news" ? (
              <main className="news-feed">
                <div className="news-feed-header">
                  <div>
                    <span className="section-label">LATEST GAMING NEWS</span>
                    <h1>Gaming News</h1>
                    <p>Fresh gaming headlines and industry updates.</p>
                  </div>
                  <div className="news-date-pill">
                    <span>●</span>
                    <span>Updated 1 Sep 2026</span>
                  </div>
                </div>

                <div className="news-layout">
                  <div className="news-main-grid">
                    {currentGamingNews.slice(0, 6).map((news, index) => {
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
                            {game?.image && <img src={game.image} alt="" />}
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
                      {currentGamingNews.slice(6, 8).map((news, index) => {
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
                            {game?.image && <img src={game.image} alt="" />}
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
                      <strong>Current sources</strong>
                      <p>
                        News links open the original publisher or reporting
                        source.
                      </p>
                    </div>
                  </aside>
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
