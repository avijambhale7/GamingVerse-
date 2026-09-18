/* =========================================================
   GAME IMAGE LOOKUP
   Loads every artwork file in the GamingVerse assets so each
   reviewed game can be matched to its real poster.
========================================================= */

/* =========================================================
   GAME IMAGE LOOKUP
   Load all common image formats from the GamingVerse assets
   so every reviewed game can get its real artwork.
========================================================= */
export const profileAllImages = import.meta.glob(
  "../../../assets/**/*.{jpg,jpeg,png,webp,avif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export function normalizeGameKey(value = "") {
  return value
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function getImageKey(path = "") {
  const fileName = path.split("/").pop() || "";
  return normalizeGameKey(fileName);
}

export const profileGameImages = Object.entries(profileAllImages).map(
  ([path, image]) => ({
    path,
    image,
    key: getImageKey(path),
  }),
);

export const gameAliases = {
  blackmythwukong: ["blackmythwukong", "blackmyth", "wukong"],
  assassinscreedshadows: [
    "assassinscreedshadows",
    "assassinscreed",
    "acshadows",
    "acs",
  ],
  gtav: ["gtav", "grandtheftautov", "gta5"],
  gtavi: ["gtavi", "grandtheftautovi", "gta6"],
  cyberpunk2077: ["cyberpunk2077", "cyberpunk"],
  rdr2: ["rdr2", "reddeadredemption2"],
  reddeadredemption2: ["rdr2", "reddeadredemption2"],
  ghostoftsushima: ["ghostoftsushima", "ghost"],
  godofwar: ["godofwar", "gow"],
  counterstrike2: ["counterstrike2", "cs2"],
  lastofuspartii: ["lastofuspartii", "lastofus2", "tlou2"],
  godofwarragnarok: [
    "godofwarragnarok",
    "godofwar5",
    "gowragnarok",
    "ragnarok",
  ],
  marvelsspiderman2: ["marvelsspiderman2", "spiderman2", "spiderman"],
  hogwartslegacy: ["hogwartslegacy"],
  eldenring: ["eldenring"],
  residentevil4: ["residentevil4", "re4"],
  callofdutyblackops6: ["callofdutyblackops6", "blackops6", "bo6"],
  forzahorizon5: ["forzahorizon5", "fh5"],
  starwarsoutlaws: ["starwarsoutlaws"],
  helldivers2: ["helldivers2"],
  alanwake2: ["alanwake2"],
  dragonsdogma2: ["dragonsdogma2"],
  finalfantasyviirebirth: [
    "finalfantasyviirebirth",
    "ff7rebirth",
    "ffviirebirth",
  ],
};

/* Canonical names used by GamingVerse reviews. */

/* Canonical names used by GamingVerse reviews. */
export const canonicalGameAliases = {
  "black myth: wukong": ["blackmythwukong", "blackmyth", "wukong"],
  "black myth wukong": ["blackmythwukong", "blackmyth", "wukong"],
  "assassin's creed shadows": [
    "assassinscreedshadows",
    "assassinscreed",
    "acshadows",
    "acs",
  ],
  "grand theft auto v": ["gtav", "gta5", "grandtheftautov"],
  "gta v": ["gtav", "gta5", "grandtheftautov"],
  "grand theft auto vi": ["gtavi", "gta6", "grandtheftautovi"],
  "gta vi": ["gtavi", "gta6", "grandtheftautovi"],
  "cyberpunk 2077": ["cyberpunk2077", "cyberpunk"],
  "ghost of tsushima": ["ghostoftsushima", "ghost"],
  "red dead redemption 2": ["rdr2", "reddeadredemption2"],
  "the last of us part ii": ["lastofuspartii", "lastofus2", "tlou2"],
  "god of war ragnarok": [
    "godofwarragnarok",
    "godofwar5",
    "gowragnarok",
    "ragnarok",
  ],
  "marvel's spider-man 2": ["marvelsspiderman2", "spiderman2", "spiderman"],
  "hogwarts legacy": ["hogwartslegacy", "hogwarts"],
  "elden ring": ["eldenring", "elden"],
  "resident evil 4": ["residentevil4", "re4"],
  "call of duty: black ops 6": ["callofdutyblackops6", "blackops6", "bo6"],
  "forza horizon 5": ["forzahorizon5", "fh5"],
  "star wars outlaws": ["starwarsoutlaws", "outlaws"],
  "helldivers 2": ["helldivers2"],
  "alan wake 2": ["alanwake2"],
  "dragon's dogma 2": ["dragonsdogma2", "dd2"],
  "final fantasy vii rebirth": [
    "finalfantasyviirebirth",
    "ff7rebirth",
    "ffviirebirth",
  ],
};

export function getGameImage(gameName = "") {
  const key = normalizeGameKey(gameName);
  if (!key) return "";

  // 1. Exact filename match.
  const exact = profileGameImages.find((item) => item.key === key);
  if (exact) return exact.image;

  // 2. Known aliases.
  const aliases = gameAliases[key] || [];
  if (aliases.length) {
    const aliasMatch = profileGameImages.find((item) =>
      aliases.some(
        (alias) =>
          item.key === alias ||
          item.key.includes(alias) ||
          alias.includes(item.key),
      ),
    );

    if (aliasMatch) return aliasMatch.image;
  }

  // 2b. Canonical aliases for the catalogue names.
  const canonicalAliases =
    canonicalGameAliases[gameName.trim().toLowerCase()] || [];
  if (canonicalAliases.length) {
    const canonicalMatch = profileGameImages.find((item) =>
      canonicalAliases.some(
        (alias) =>
          item.key === alias ||
          item.key.includes(alias) ||
          alias.includes(item.key),
      ),
    );
    if (canonicalMatch) return canonicalMatch.image;
  }

  // 3. Partial filename match.
  const partial = profileGameImages.find(
    (item) => item.key.includes(key) || key.includes(item.key),
  );

  if (partial) return partial.image;

  // 4. Token matching. This handles filenames with extra
  // words such as "cover", "poster", "horizontal", etc.
  const tokens = gameName
    .toLowerCase()
    .replace(/['’`]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  if (tokens.length) {
    const scored = profileGameImages
      .map((item) => ({
        ...item,
        score: tokens.reduce(
          (total, token) => total + (item.key.includes(token) ? 1 : 0),
          0,
        ),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (
      scored.length &&
      scored[0].score >= Math.max(1, Math.ceil(tokens.length * 0.5))
    ) {
      return scored[0].image;
    }
  }

  return "";
}

export function formatGameName(gameName = "") {
  const normalized = gameName.trim();

  const knownNames = {
    "cyberpunk-2077": "Cyberpunk 2077",
    cyberpunk2077: "Cyberpunk 2077",
    "assassin-s-creed-shadows": "Assassin's Creed Shadows",
    "assassin-s creed shadows": "Assassin's Creed Shadows",
    "assassins-creed-shadows": "Assassin's Creed Shadows",
    "assassins creed shadows": "Assassin's Creed Shadows",
    rdr2: "Red Dead Redemption 2",
    "red-dead-redemption-2": "Red Dead Redemption 2",
    "ghost-of-tsushima": "Ghost of Tsushima",
    "god-of-war": "God of War",
    "counter-strike-2": "Counter-Strike 2",
    "black-myth-wukong": "Black Myth: Wukong",
  };

  return (
    knownNames[normalized.toLowerCase()] ||
    normalized
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}
