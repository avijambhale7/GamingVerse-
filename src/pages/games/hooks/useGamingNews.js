/* =========================================================
   useGamingNews
   Live gaming headlines from Google News (via rss2json — no API
   key needed), refreshed every 10 minutes, with the saved list in
   ../data/news.js as the fallback. Used by ../../Games.jsx.
========================================================= */
import { useCallback, useEffect, useState } from "react";
import { currentGamingNews } from "../data/news.js";

// Plain text from an RSS title/description (tags and entities removed).
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

export default function useGamingNews() {
  const [liveNews, setLiveNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState(null);
  const [newsError, setNewsError] = useState("");

  // Stable across renders (it only uses state setters), so the refresh
  // timer below is set up once and the returned function is safe to
  // pass around.
  const fetchLiveGamingNews = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the news feed on mount, then refresh it every 10 minutes.
    fetchLiveGamingNews();

    const interval = window.setInterval(fetchLiveGamingNews, 10 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [fetchLiveGamingNews]);

  const newsItems = liveNews.length ? liveNews : currentGamingNews;

  return {
    fetchLiveGamingNews,
    liveNews,
    newsError,
    newsItems,
    newsLoading,
    newsUpdatedAt,
  };
}
