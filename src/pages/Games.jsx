/*
  GAMINGVERSE - GAMES PAGE

  The page's data, helpers, views and styles live in ./games/*:
    games/data/*       static catalogues (details, trailers, clubs, news…)
    games/utils/*      text, catalogue, media, RAWG and age-gating helpers
    games/components/* shared presentational pieces
    games/views/*      one file per screen the page can show
    games/styles/*     the section stylesheets wired up by Games.css

  What stays here is the Games component itself: state, effects,
  Firebase wiring, and the props it hands to each view.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { db, auth } from "../firebase";
import "./Games.css";
import Marketplace from "./Marketplace";
import Cafe from "./Cafe";

import DiscoverView from "./games/views/DiscoverView.jsx";
import FollowingView from "./games/views/FollowingView.jsx";
import GameDetailsModal from "./games/views/GameDetailsModal.jsx";
import GamesFooter from "./games/views/GamesFooter.jsx";
import GamesNavbar from "./games/views/GamesNavbar.jsx";
import HomeView from "./games/views/HomeView.jsx";
import PosterModal from "./games/views/PosterModal.jsx";
import SpacesView from "./games/views/SpacesView.jsx";
import Top100View from "./games/views/Top100View.jsx";
import TrailerModal from "./games/views/TrailerModal.jsx";
import UpcomingsView from "./games/views/UpcomingsView.jsx";

import { gameAgeRatings } from "./games/data/ageRatings.js";
import {
  DEFAULT_CLUB_DISCUSSIONS,
  DEFAULT_GAMING_CLUBS,
} from "./games/data/clubs.js";
import { currentGamingNews } from "./games/data/news.js";
import { emptyCounts } from "./games/data/reviewOptions.js";
import {
  calculateAgeFromDob,
  canAccessGame,
  getRequiredGameAge,
  isBlockedGame,
} from "./games/utils/access.js";
import {
  completeGameCatalogue,
  CURATED_GAME_NAME_KEYS,
  getBestLocalCatalogueImage,
  horizontalGames,
  posterGames,
  priorityGameRank,
} from "./games/utils/catalogue.js";
import {
  automaticGameDetailsCache,
  getGameCategory,
  getGameDetails,
  matchesHomeCategory,
} from "./games/utils/gameInfo.js";
import {
  extractYouTubeId,
  getBestLocalImage,
  getGameMediaFallback,
  getVerifiedTrailerUrl,
  resolveGameMedia,
} from "./games/utils/media.js";
import {
  mapRawgGame,
  RAWG_API_KEY,
  RAWG_KEY_IS_EXHAUSTED_DEMO,
  rawgGameHasAllowedPlatform,
  rawgGameIsSafe,
} from "./games/utils/rawg.js";
import {
  containsBlockedGameTerm,
  createGameId,
  localImageSimilarity,
  normalizeCatalogueImageKey,
  normalizeGameSearchText,
  normalizeLibraryGameName,
  normalizePriorityGameName,
  normalizeTrailerGameName,
} from "./games/utils/text.js";

/* =========================================================
   GAMES PAGE
========================================================= */
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
  const [activityReviews, setActivityReviews] = useState([]);
  const [top100Filter, setTop100Filter] = useState("All");
  const [top100Sort, setTop100Sort] = useState("Game");
  const [gamingVerseRatings, setGamingVerseRatings] = useState({});
  const [discoverSort, setDiscoverSort] = useState("Newest Releases");
  const [discoverPlatform, setDiscoverPlatform] = useState("All Platforms");
  const [discoverGenre, setDiscoverGenre] = useState("All Genres");
  const [discoverRelease, setDiscoverRelease] = useState("All Releases");
  const [discoverPreset, setDiscoverPreset] = useState("");
  const [spacesSection, setSpacesSection] = useState("feed");

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDiscoverMenu, setShowDiscoverMenu] = useState(false);
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
  const trailerSessionRef = useRef(0);
  // Which game the composer verdict has already been seeded for.
  const seededVerdictForRef = useRef("");
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
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewText, setReviewText] = useState("");
  /* Starts empty so nothing looks pre-voted. The live listener fills it in
     with this account's existing verdict when there is one. */
  const [composerVerdict, setComposerVerdict] = useState("");
  const [communityReviews, setCommunityReviews] = useState([]);
  const [likedReviewIds, setLikedReviewIds] = useState([]);
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
       Every written review across every game, newest first.
       Reads the same gameReviews node the meter does, so the
       feed shows what the community actually posted rather
       than whatever happened to be in this browser.
  ======================================================= */
  useEffect(() => {
    if (activeView !== "following") return undefined;

    return onValue(
      ref(db, "gameReviews"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const reviews = [];

        Object.entries(data).forEach(([gameId, gameEntries]) => {
          Object.entries(gameEntries || {}).forEach(([userId, review]) => {
            const text = String(review?.text || "").trim();
            if (!text || !review?.review) return;

            reviews.push({
              id: `${gameId}-${userId}`,
              gameId,
              gameName: review.gameName || gameId,
              gameImage: "",
              userName: review.userName || "Gamer",
              initials: review.initials || "G",
              verdict: review.review,
              text,
              createdAt: Number(review.updatedAt || review.createdAt) || 0,
              likes: Object.keys(review.likes || {}).length,
            });
          });
        });

        reviews.sort((a, b) => b.createdAt - a.createdAt);
        setActivityReviews(reviews);
      },
      (error) => {
        console.error("Following activity listener error:", error);
        setActivityReviews([]);
      },
    );
  }, [activeView]);

  /* =======================================================
       AUTOMATIC GAME CATALOGUE + UPCOMING GAMES
       Fetches the full PC / PlayStation / Xbox catalogue and
       a separate future-release catalogue from RAWG.
     ======================================================= */
  useEffect(() => {
    let cancelled = false;

    const fetchAutomaticGames = async () => {
      if (!RAWG_API_KEY) {
        const reason = RAWG_KEY_IS_EXHAUSTED_DEMO
          ? "That RAWG key has used up its monthly limit. Get your own free key at rawg.io/apidocs, put it in .env.local as VITE_RAWG_API_KEY, then restart the dev server."
          : "No RAWG API key found. Add VITE_RAWG_API_KEY to .env.local, then restart the dev server. See src/pages/games/utils/rawg.js.";

        setAutomaticGames([]);
        setUpcomingGames([]);
        setAutomaticGamesLoading(false);
        setUpcomingGamesLoading(false);
        setAutomaticGamesError(reason);
        setUpcomingGamesError(reason);
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
            // RAWG explains key problems in the body ("The monthly API limit
            // reached", "Invalid API key"). Surface it instead of a bare code.
            const reason = await response
              .json()
              .then((body) => body?.error || body?.detail || "")
              .catch(() => "");
            throw new Error(
              response.status === 401 || response.status === 403
                ? `RAWG rejected the API key (${response.status})${reason ? `: ${reason}` : ""}`
                : `Automatic games request failed (${response.status}) on page ${page}${reason ? `: ${reason}` : ""}`,
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
          const raw = String(error?.message || "").trim();
          // RAWG answers a bad key with a 401 that carries no CORS headers,
          // so the browser hides the status and fetch() only says "Failed to
          // fetch" - the same message a real outage gives. Name both causes.
          const reason = /failed to fetch|networkerror|load failed/i.test(raw)
            ? "Could not reach RAWG. The API key may be invalid or out of quota, or the network is blocking api.rawg.io."
            : raw;

          setAutomaticGamesError(
            `Automatic game refresh failed. Your saved GamingVerse games are still available.${
              reason ? ` ${reason}` : ""
            }`,
          );
          setUpcomingGamesError(
            `Upcoming games could not be loaded right now.${
              reason ? ` ${reason}` : ""
            }`,
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
       CLOSE PROFILE / NOTIFICATIONS ON OUTSIDE CLICK
    ======================================================= */
  useEffect(() => {
    const handleDocumentClick = (event) => {
      const target = event.target;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowNotifications(false);
        setShowDiscoverMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
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
      } catch {
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
      return undefined;
    }
    const gameId = createGameId(selectedGame.name);
    const reviewsRef = ref(db, `gameReviews/${gameId}`);

    const unsubscribe = onValue(
      reviewsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const counts = {
          perfection: 0,
          "go-for-it": 0,
          timepass: 0,
          skip: 0,
        };
        let myVerdict = "";
        const reviews = [];
        const myLikes = [];

        Object.entries(data).forEach(([userId, userReview]) => {
          if (!userReview || !userReview.review) {
            return;
          }
          if (counts[userReview.review] !== undefined) {
            counts[userReview.review] += 1;
          }
          if (userId === auth.currentUser?.uid) {
            myVerdict = userReview.review;
          }

          const likes = userReview.likes || {};
          if (likes[auth.currentUser?.uid]) myLikes.push(userId);

          const comments = Object.entries(userReview.comments || {})
            .map(([commentId, comment]) => ({
              id: commentId,
              userId: comment?.userId || "",
              userName: comment?.userName || "Gamer",
              initials: comment?.initials || "G",
              text: String(comment?.text || ""),
              createdAt: Number(comment?.createdAt) || 0,
            }))
            .filter((comment) => comment.text)
            .sort((a, b) => a.createdAt - b.createdAt);

          // A verdict on its own is a complete review, so it is listed too
          // rather than only counted.
          reviews.push({
            id: userId,
            userId,
            userName: userReview.userName || "Gamer",
            initials: userReview.initials || "G",
            verdict: userReview.review,
            text: String(userReview.text || "").trim(),
            createdAt: Number(userReview.updatedAt || userReview.createdAt) || 0,
            likes: Object.keys(likes).length,
            comments,
            isMine: userId === auth.currentUser?.uid,
          });
        });

        setReviewCounts(counts);
        setCommunityReviews(reviews);
        setLikedReviewIds(myLikes);

        // Seed the composer with this account's existing verdict, but only
        // the first time this game's votes arrive. Doing it on every
        // snapshot would yank a half-made choice back to the saved one the
        // moment somebody else voted.
        if (myVerdict && seededVerdictForRef.current !== gameId) {
          seededVerdictForRef.current = gameId;
          setComposerVerdict(myVerdict);
        }
      },
      (error) => {
        // Without this handler a rejected read left the meter sitting at
        // 0% with nothing logged and no way to tell it had failed.
        console.error("Game reviews listener error:", error);
        setReviewCounts(emptyCounts);
        setReviewMessage(
          "Could not load the GamingVerse Meter. Publish database.rules.json so gameReviews is readable.",
        );
      },
    );
    return () => unsubscribe();
    // Keyed on the name, not the object: opening a trailer replaces
    // selectedGame with a copy, which used to tear down and rebuild this
    // subscription — and reset the composer — for the same game.
  }, [selectedGame?.name]);
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
    setReviewMessage("");

    // Known trailers should open immediately. No RAWG request is needed.
    if (knownYoutubeTrailer) return;

    if (!RAWG_API_KEY) {
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
    }
  };
  const openPoster = (game) => {
    if (!game?.image) return;

    // Poster click must NEVER open or retain the trailer.
    trailerSessionRef.current += 1;
    showTrailerRef.current = false;
    setShowTrailer(false);
    setShowPoster(true);
  };

  const closePoster = () => {
    setShowPoster(false);
  };

  const closeTrailer = () => {
    trailerSessionRef.current += 1;
    showTrailerRef.current = false;
    setShowTrailer(false);
    setShowDetails(false);
    setSelectedGame(null);
    setReviewMessage("");
  };
  /* Post is the one place anything is saved. Choosing a verdict only
     selects it; pressing Post records the vote, and additionally files a
     written review when the box is not empty. */
  const postCommunityReview = async () => {
    const text = reviewText.trim();
    if (!selectedGame) return;
    if (!composerVerdict) {
      setReviewMessage("Choose a verdict before posting.");
      return;
    }

    // One write carries both. The live listener then rebuilds the meter and
    // the review list from that same record, so they cannot drift apart.
    const saved = await submitReview(composerVerdict, {
      silent: Boolean(text),
      text,
    });
    if (!saved) return; // submitReview has already explained why.

    if (!text) {
      addGamingVerseNotification(
        "GamingVerse Verdict",
        `Your ${composerVerdict.replace("-", " ")} verdict for ${selectedGame.name} was saved.`,
        "activity",
      );
      window.dispatchEvent(new Event("gamingverse-notification"));
      return;
    }

    setReviewText("");
    setReviewMessage("✓ Review posted successfully.");
    addGamingVerseNotification(
      "GamingVerse Review",
      `Your ${composerVerdict.replace("-", " ")} review for ${selectedGame.name} was posted.`,
      "activity",
    );
    window.dispatchEvent(new Event("gamingverse-notification"));
  };

  /* Your review is the record keyed by your uid, so removing it is a single
     delete. The listener then drops it from the list and the meter. */
  const deleteMyReview = async () => {
    if (!selectedGame) return;
    if (!auth.currentUser) {
      setReviewMessage("Please login first.");
      return;
    }
    const gameId = createGameId(selectedGame.name);
    try {
      setReviewLoading(true);
      await remove(ref(db, `gameReviews/${gameId}/${auth.currentUser.uid}`));
      setComposerVerdict("");
      setReviewText("");
      seededVerdictForRef.current = "";
      setReviewMessage("✓ Your review has been deleted.");
    } catch (error) {
      console.error("Review delete error:", error);
      setReviewMessage("Could not delete that review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  /* Comments hang off the review they answer. Anyone signed in may add one;
     only its author (or the review's owner) may remove it. */
  const postReviewComment = async (reviewId, text) => {
    const body = String(text || "").trim();
    if (!selectedGame || !body) return false;
    if (!auth.currentUser) {
      setReviewMessage("Please login first to comment.");
      return false;
    }
    const user = auth.currentUser;
    const displayName =
      user.displayName?.trim() || user.email?.split("@")[0] || "Gamer";
    const gameId = createGameId(selectedGame.name);
    try {
      await push(ref(db, `gameReviews/${gameId}/${reviewId}/comments`), {
        userId: user.uid,
        userName: displayName,
        initials: displayName.charAt(0).toUpperCase(),
        text: body.slice(0, 500),
        createdAt: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Comment error:", error);
      setReviewMessage("Could not post that comment. Please try again.");
      return false;
    }
  };

  const deleteReviewComment = async (reviewId, commentId) => {
    if (!selectedGame || !auth.currentUser) return;
    const gameId = createGameId(selectedGame.name);
    try {
      await remove(
        ref(db, `gameReviews/${gameId}/${reviewId}/comments/${commentId}`),
      );
    } catch (error) {
      console.error("Comment delete error:", error);
      setReviewMessage("Could not delete that comment.");
    }
  };

  /* Likes live under the review they belong to, keyed by the liker, so the
     count is the same for everyone instead of a private localStorage tally. */
  const toggleReviewLike = async (reviewId) => {
    if (!selectedGame) return;
    if (!auth.currentUser) {
      setReviewMessage("Please login first to like a review.");
      return;
    }
    const gameId = createGameId(selectedGame.name);
    const likerId = auth.currentUser.uid;
    const hasLiked = likedReviewIds.includes(reviewId);
    try {
      await set(
        ref(db, `gameReviews/${gameId}/${reviewId}/likes/${likerId}`),
        hasLiked ? null : true,
      );
    } catch (error) {
      console.error("Review like error:", error);
      setReviewMessage("Could not update that like. Please try again.");
    }
  };
  const formatReviewAge = (timestamp) => {
    const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };
  /* Newest first. With the sort control removed there is one obvious
     order, and a fresh review should land where its author can see it. */
  const visibleCommunityReviews = [...communityReviews].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  /* =======================================================
       SAVE REVIEW
    ======================================================= */
  /* Returns whether the vote reached the database. `silent` suppresses the
     success line so a caller that posts a written review can report on the
     whole operation instead of being talked over. */
  const submitReview = async (reviewId, { silent = false, text = "" } = {}) => {
    try {
      if (!selectedGame) return false;
      if (!auth.currentUser) {
        setReviewMessage("Please login first to submit your review.");
        return false;
      }
      const user = auth.currentUser;
      const userId = user.uid;
      const gameId = createGameId(selectedGame.name);
      setReviewLoading(true);
      setReviewMessage("");

      const displayName =
        user.displayName?.trim() || user.email?.split("@")[0] || "Gamer";

      // One record per user per game holds both the verdict and the written
      // review, so the meter and the review list can never disagree. Likes
      // are kept because another user owns those keys.
      const existing = communityReviews.find((item) => item.id === userId);
      const reviewRef = ref(db, `gameReviews/${gameId}/${userId}`);
      await update(reviewRef, {
        gameId,
        gameName: selectedGame.name,
        userId,
        userName: displayName,
        initials: displayName.charAt(0).toUpperCase(),
        review: reviewId,
        text: text || existing?.text || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (!silent) setReviewMessage("✓ Your verdict has been saved.");
      return true;
    } catch (error) {
      console.error("Review error:", error);
      // A missing rule for gameReviews looks exactly like a network
      // failure unless the code is shown, so show it.
      const denied = String(error?.code || "").includes("permission-denied");
      setReviewMessage(
        denied
          ? "Your verdict could not be saved: the database rejected it (PERMISSION_DENIED). Publish database.rules.json in the Firebase console."
          : `Unable to save your verdict. Please try again. (${error?.message || "unknown error"})`,
      );
      return false;
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
      <GamesNavbar
        activeCategory={activeCategory}
        activeView={activeView}
        focusSearch={focusSearch}
        navigate={navigate}
        notificationTab={notificationTab}
        notifications={notifications}
        openDetails={openDetails}
        profileMenuRef={profileMenuRef}
        search={search}
        searchInputRef={searchInputRef}
        searchResults={searchResults}
        setActiveCategory={setActiveCategory}
        setActiveView={setActiveView}
        setNotificationTab={setNotificationTab}
        setNotifications={setNotifications}
        setSearch={setSearch}
        setShowDiscoverMenu={setShowDiscoverMenu}
        setShowNotifications={setShowNotifications}
        setSpacesSection={setSpacesSection}
        showDiscoverMenu={showDiscoverMenu}
        showNotifications={showNotifications}
      />

      {/* ===================================================
            UPCOMING GAMES
        =================================================== */}
      <UpcomingsView
        activeView={activeView}
        filteredUpcomingGames={filteredUpcomingGames}
        openDetails={openDetails}
        upcomingGamesError={upcomingGamesError}
        upcomingGamesLoading={upcomingGamesLoading}
        userAge={userAge}
      />

      {/* ===================================================
            DISCOVER
        =================================================== */}
      <DiscoverView
        activeView={activeView}
        discoverGames={discoverGames}
        discoverGenre={discoverGenre}
        discoverHasSelection={discoverHasSelection}
        discoverPlatform={discoverPlatform}
        discoverPreset={discoverPreset}
        discoverRelease={discoverRelease}
        discoverSort={discoverSort}
        gamingVerseRatings={gamingVerseRatings}
        openDetails={openDetails}
        setDiscoverGenre={setDiscoverGenre}
        setDiscoverPlatform={setDiscoverPlatform}
        setDiscoverPreset={setDiscoverPreset}
        setDiscoverRelease={setDiscoverRelease}
        setDiscoverSort={setDiscoverSort}
        userAge={userAge}
      />

      {/* ===================================================
            TOP 100 GAMES
        =================================================== */}
      <Top100View
        activeView={activeView}
        gamingVerseRatings={gamingVerseRatings}
        openDetails={openDetails}
        setTop100Filter={setTop100Filter}
        setTop100Sort={setTop100Sort}
        top100Filter={top100Filter}
        top100FormatVotes={top100FormatVotes}
        top100Games={top100Games}
        top100Sort={top100Sort}
        top100Year={top100Year}
      />

      {/* ===================================================
            FOLLOWING ACTIVITY
        =================================================== */}
      <FollowingView
        activeView={activeView}
        activityFilter={activityFilter}
        activityReviews={activityReviews}
        activitySort={activitySort}
        setActivityFilter={setActivityFilter}
        setActivitySort={setActivitySort}
      />

      {/* ===================================================
            HOME
        =================================================== */}
      <HomeView
        activeCategory={activeCategory}
        activeView={activeView}
        automaticGamesError={automaticGamesError}
        filteredAutomaticGames={filteredAutomaticGames}
        filteredHorizontal={filteredHorizontal}
        filteredPosters={filteredPosters}
        heroGames={heroGames}
        heroIndex={heroIndex}
        openDetails={openDetails}
        openMeter={openMeter}
        setActiveCategory={setActiveCategory}
        setHeroIndex={setHeroIndex}
        setSearch={setSearch}
        setShowAllAutomaticGames={setShowAllAutomaticGames}
        setShowAllCatalogueGames={setShowAllCatalogueGames}
        setShowAllFeaturedGames={setShowAllFeaturedGames}
        showAllAutomaticGames={showAllAutomaticGames}
        showAllCatalogueGames={showAllCatalogueGames}
        showAllFeaturedGames={showAllFeaturedGames}
        userAge={userAge}
        visibleAutomaticGames={visibleAutomaticGames}
      />

      {/* ===================================================
            SPACES — TRAILERS, NEWS, CLUBS
        =================================================== */}
      <SpacesView
        activeView={activeView}
        closeClub={closeClub}
        clubDiscussions={clubDiscussions}
        clubInterest={clubInterest}
        clubPost={clubPost}
        clubSearch={clubSearch}
        communityTalkPost={communityTalkPost}
        communityTalks={communityTalks}
        createGamingClub={createGamingClub}
        fetchLiveGamingNews={fetchLiveGamingNews}
        filteredGamingClubs={filteredGamingClubs}
        filteredHorizontal={filteredHorizontal}
        filteredPosters={filteredPosters}
        gamingClubs={gamingClubs}
        joinedClubIds={joinedClubIds}
        liveNews={liveNews}
        newClubDescription={newClubDescription}
        newClubInterest={newClubInterest}
        newClubName={newClubName}
        newsError={newsError}
        newsItems={newsItems}
        newsLoading={newsLoading}
        newsUpdatedAt={newsUpdatedAt}
        openClub={openClub}
        openDetails={openDetails}
        postClubDiscussion={postClubDiscussion}
        postCommunityTalk={postCommunityTalk}
        selectedClubId={selectedClubId}
        setActiveView={setActiveView}
        setClubInterest={setClubInterest}
        setClubPost={setClubPost}
        setClubSearch={setClubSearch}
        setCommunityTalkPost={setCommunityTalkPost}
        setJoinedClubIds={setJoinedClubIds}
        setNewClubDescription={setNewClubDescription}
        setNewClubInterest={setNewClubInterest}
        setNewClubName={setNewClubName}
        setSelectedClubId={setSelectedClubId}
        setShowCreateClub={setShowCreateClub}
        setSpacesSection={setSpacesSection}
        showCreateClub={showCreateClub}
        spacesSection={spacesSection}
        toggleClubMembership={toggleClubMembership}
      />

      {/* ===================================================
            GAME DETAILS
        =================================================== */}
      <GameDetailsModal
        closeDetails={closeDetails}
        collectionGames={collectionGames}
        composerVerdict={composerVerdict}
        formatReviewAge={formatReviewAge}
        likedReviewIds={likedReviewIds}
        meterPercent={meterPercent}
        positiveVotes={positiveVotes}
        openPoster={openPoster}
        openTrailer={openTrailer}
        postCommunityReview={postCommunityReview}
        reviewCounts={reviewCounts}
        reviewLoading={reviewLoading}
        reviewMessage={reviewMessage}
        reviewText={reviewText}
        selectedGame={selectedGame}
        setComposerVerdict={setComposerVerdict}
        setReviewText={setReviewText}
        showDetails={showDetails}
        toggleCollection={toggleCollection}
        deleteMyReview={deleteMyReview}
        deleteReviewComment={deleteReviewComment}
        postReviewComment={postReviewComment}
        toggleReviewLike={toggleReviewLike}
        toggleWatchLater={toggleWatchLater}
        toggleWatched={toggleWatched}
        top100FormatVotes={top100FormatVotes}
        totalVotes={totalVotes}
        trailerMediaMap={trailerMediaMap}
        visibleCommunityReviews={visibleCommunityReviews}
        watchLaterGames={watchLaterGames}
        watchedGames={watchedGames}
      />

      {/* ===================================================
            POSTER PREVIEW
        =================================================== */}
      <PosterModal
        closePoster={closePoster}
        selectedGame={selectedGame}
        showPoster={showPoster}
      />

      {/* ===================================================
            TRAILER PLAYER
        =================================================== */}
      <TrailerModal
        closeTrailer={closeTrailer}
        selectedGame={selectedGame}
        showTrailer={showTrailer}
      />

      {/* ===================================================
            MARKETPLACE / CAFÉ — SAME GAMES PAGE VIEW
        =================================================== */}
      {activeView === "marketplace" && <Marketplace embedded />}
      {activeView === "cafe" && <Cafe embedded />}

      {/* ===================================================
            FOOTER
        =================================================== */}
      <GamesFooter />
    </div>
  );
}
export default Games;
