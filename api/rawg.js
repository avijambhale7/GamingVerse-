/* =========================================================
   RAWG PROXY  (Vercel serverless function)
   GET /api/rawg?path=games[/<id>[/movies]]&<RAWG query params>

   The browser used to call api.rawg.io directly with the API key
   in the URL, so anyone could copy it. Now the key stays on the
   server (it reads the existing VITE_RAWG_API_KEY, or RAWG_API_KEY),
   only the game endpoints the app uses are allowed through, and
   Vercel's CDN caches answers so repeat page loads don't spend
   RAWG quota.
========================================================= */

const ALLOWED_PATH = /^games(\/\d{1,9}(\/movies)?)?$/;
const ALLOWED_PARAMS = new Set([
  "search",
  "search_precise",
  "search_exact",
  "page",
  "page_size",
  "platforms",
  "parent_platforms",
  "dates",
  "ordering",
  "genres",
  "metacritic",
  "exclude_additions",
]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = String(process.env.RAWG_API_KEY || process.env.VITE_RAWG_API_KEY || "").trim();
  if (!key) return res.status(503).json({ error: "RAWG is not configured on the server" });

  const path = String(req.query?.path || "");
  if (!ALLOWED_PATH.test(path)) return res.status(400).json({ error: "Invalid path" });

  const params = new URLSearchParams({ key });
  Object.entries(req.query || {}).forEach(([name, value]) => {
    if (ALLOWED_PARAMS.has(name) && value != null) {
      params.set(name, String(Array.isArray(value) ? value[0] : value).slice(0, 200));
    }
  });

  try {
    const upstream = await fetch(`https://api.rawg.io/api/${path}?${params}`);
    const body = await upstream.text();
    res.setHeader("Content-Type", "application/json");
    if (upstream.ok) {
      // Game data changes slowly: cache for an hour, serve stale while refreshing.
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    }
    return res.status(upstream.status).send(body);
  } catch (error) {
    console.error("RAWG proxy failed:", error);
    return res.status(502).json({ error: "RAWG request failed" });
  }
}
