/* =========================================================
   TRAILER SEARCH (client)
   Asks /api/trailer for a game's YouTube trailer and remembers
   the answer in localStorage, so reopening a trailer is instant.
   prefetchTrailer() starts the lookup early (when a game's details
   open), so the trailer is usually ready before anyone clicks it.
========================================================= */

const CACHE_KEY = "gamingverse_trailer_cache_v1";
// Don't re-ask for a game with no trailer more than once a day.
const MISS_TTL_MS = 24 * 60 * 60 * 1000;
// One request per game at a time, shared by prefetch and click.
const inFlight = new Map();

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...readCache(), [key]: value }),
    );
  } catch {
    // Storage unavailable — the next open just searches again.
  }
}

/* Instant answer from the cache: a watch URL, or "" if not cached. */
export function getCachedTrailer(gameName) {
  const key = String(gameName || "")
    .trim()
    .toLowerCase();
  const videoId = key ? readCache()[key]?.videoId : "";
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
}

/* Returns a YouTube watch URL, or "" when no trailer is found. */
export function findYouTubeTrailer(gameName) {
  const name = String(gameName || "").trim();
  if (!name) return Promise.resolve("");
  const key = name.toLowerCase();

  const cached = readCache()[key];
  if (cached?.videoId) {
    return Promise.resolve(`https://www.youtube.com/watch?v=${cached.videoId}`);
  }
  if (cached?.missAt && Date.now() - cached.missAt < MISS_TTL_MS) {
    return Promise.resolve("");
  }

  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      requestTrailer(name, key).finally(() => inFlight.delete(key)),
    );
  }
  return inFlight.get(key);
}

export function prefetchTrailer(gameName) {
  findYouTubeTrailer(gameName).catch(() => {});
}

async function requestTrailer(name, key) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`/api/trailer?q=${encodeURIComponent(name)}`, {
      signal: controller.signal,
    });
    if (response.status === 404) {
      writeCache(key, { missAt: Date.now() });
      return "";
    }
    if (!response.ok) return "";
    const data = await response.json();
    if (!/^[A-Za-z0-9_-]{11}$/.test(data?.videoId || "")) return "";
    writeCache(key, { videoId: data.videoId });
    return `https://www.youtube.com/watch?v=${data.videoId}`;
  } catch {
    return "";
  } finally {
    window.clearTimeout(timer);
  }
}
