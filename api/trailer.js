/* =========================================================
   TRAILER SEARCH  (Vercel serverless function)
   GET /api/trailer?q=<game name>  →  { videoId, title }

   Finds a game's official trailer on YouTube, for games that
   aren't in the hand-picked VERIFIED_YOUTUBE_TRAILERS list (RAWG
   no longer returns trailer clips for most games).

   Uses the YouTube Data API when YOUTUBE_API_KEY is set (only
   embeddable videos). Otherwise it reads YouTube's public search
   results page. Answers are cached by Vercel's CDN for a week,
   so each game is only searched about once.
========================================================= */

const CACHE_HEADER = "public, s-maxage=604800, stale-while-revalidate=86400";

function decodeJsonText(text) {
  try {
    return JSON.parse(`"${text}"`);
  } catch {
    return text;
  }
}

function scoreTitle(title, game) {
  const lower = title.toLowerCase();
  let score = 0;
  if (lower.includes("trailer")) score += 3;
  if (lower.includes("official")) score += 1;
  if (/reaction|review|explained|tier list|ranking/.test(lower)) score -= 4;
  const words = game
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);
  const hits = words.filter((word) => lower.includes(word)).length;
  if (words.length) score += (hits / words.length) * 3;
  return score;
}

function pickBest(videos, game) {
  let best = null;
  videos.forEach((video, index) => {
    // Earlier results win ties: YouTube's own ranking is a good signal.
    const score = scoreTitle(video.title, game) - index * 0.05;
    if (!best || score > best.score) best = { ...video, score };
  });
  return best ? { videoId: best.videoId, title: best.title } : null;
}

async function searchWithApi(game, key) {
  const url =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
    "&videoEmbeddable=true&maxResults=8" +
    `&q=${encodeURIComponent(`${game} official trailer`)}` +
    `&key=${encodeURIComponent(key)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube API ${response.status}`);
  const data = await response.json();
  const videos = (data.items || [])
    .map((item) => ({
      videoId: item?.id?.videoId,
      title: item?.snippet?.title || "",
    }))
    .filter((video) => video.videoId);
  return pickBest(videos, game);
}

async function searchResultsPage(game) {
  const url =
    "https://www.youtube.com/results?sp=EgIQAQ%253D%253D&search_query=" +
    encodeURIComponent(`${game} official trailer`);
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`YouTube search ${response.status}`);
  const html = await response.text();

  const videos = [];
  const chunks = html.split('"videoRenderer":{"videoId":"').slice(1, 11);
  for (const chunk of chunks) {
    const videoId = chunk.slice(0, 11);
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) continue;
    const titleMatch = chunk
      .slice(0, 5000)
      .match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    videos.push({
      videoId,
      title: titleMatch ? decodeJsonText(titleMatch[1]) : "",
    });
  }
  return pickBest(videos, game);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const game = String(req.query?.q || "").trim().slice(0, 100);
  if (game.length < 2) {
    return res.status(400).json({ error: "Missing game name" });
  }

  try {
    const key = process.env.YOUTUBE_API_KEY;
    const result = key
      ? await searchWithApi(game, key).catch(() => searchResultsPage(game))
      : await searchResultsPage(game);

    if (!result) {
      res.setHeader("Cache-Control", "public, s-maxage=86400");
      return res.status(404).json({ error: "No trailer found" });
    }

    res.setHeader("Cache-Control", CACHE_HEADER);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Trailer search failed:", error);
    return res.status(502).json({ error: "Trailer search failed" });
  }
}
