/* =========================================================
   CAFÉ LOCATIONS
   Cafés store an address and (optionally) a Google Maps link,
   not coordinates. Coordinates come from the link when it has
   them ("@18.52,73.85", "q=18.52,73.85", "!3d18.52!4d73.85");
   otherwise the address is looked up once on OpenStreetMap
   (Nominatim) and remembered in this browser.
========================================================= */

const CACHE_KEY = "gamingverse_cafe_geo_v1";

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
    // Storage full or blocked: we'll just look it up again next time.
  }
}

const valid = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180 &&
  !(lat === 0 && lng === 0);

function coordsFromMapUrl(url) {
  const text = decodeURIComponent(String(url || ""));
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|query|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (valid(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

export function cachedCoords(cafe) {
  return (
    coordsFromMapUrl(cafe.mapUrl) || readCache()[cafe.address?.trim()] || null
  );
}

/* Looks up an address on OpenStreetMap. Returns {lat, lng} or null.
   Misses are remembered too, so a bad address isn't retried forever. */
export async function geocodeAddress(address) {
  const key = String(address || "").trim();
  if (!key) return null;
  const cache = readCache();
  if (key in cache) return cache[key];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(key)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return null;
    const [hit] = await response.json();
    const coords =
      hit && valid(Number(hit.lat), Number(hit.lon))
        ? { lat: Number(hit.lat), lng: Number(hit.lon) }
        : null;
    writeCache(key, coords);
    return coords;
  } catch {
    return null;
  }
}

/* Straight-line distance in km (haversine). */
export function distanceKm(a, b) {
  if (!a || !b) return null;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const formatKm = (km) =>
  km == null
    ? ""
    : km < 1
      ? `${Math.round(km * 1000)} m away`
      : `${km.toFixed(1)} km away`;
