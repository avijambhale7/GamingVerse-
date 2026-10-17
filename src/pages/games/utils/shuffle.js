/* =========================================================
   SEEDED SHUFFLE
   The same seed always gives the same order, so a re-render
   doesn't reshuffle by itself — only a new seed does (a new
   visit, or the Live Catalogue's timed reshuffle).
========================================================= */

// Small, fast pseudo-random generator (mulberry32).
function randomFrom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A shuffled copy of `list` (Fisher–Yates); the original is untouched.
export function seededShuffle(list, seed) {
  const out = [...list];
  const random = randomFrom(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
