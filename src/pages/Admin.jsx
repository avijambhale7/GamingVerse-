import { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, onValue, push, ref, remove, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import PageSkeleton from "../components/PageSkeleton.jsx";
import { normalizeCafe } from "./cafe/utils/cafeModel.js";
import ImageUploadButton from "../components/ImageUploadButton.jsx";
import {
  normalizeCatalogueImageKey,
  normalizeGameSearchText,
} from "./games/utils/text.js";
import { completeGameCatalogue } from "./games/utils/catalogue.js";
import { lookupMissingPosters } from "./games/utils/posterLookup.js";
import AdminActivityChart from "./admin/AdminActivityChart.jsx";

// Module scope, evaluated once at page load — not a render-time call, so
// the activity chart's "last 14 days" window doesn't need Date.now() (an
// impure function) inside a hook.
const PAGE_LOAD_TIME = Date.now();

const EMPTY_GAME_FORM = {
  name: "",
  image: "",
  genre: "",
  platforms: "",
  releaseDate: "",
  developer: "",
  publisher: "",
  description: "",
};

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [section, setSection] = useState("overview");
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [games, setGames] = useState([]);
  const [hiddenGames, setHiddenGames] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all"); // all | banned | active

  const [gameForm, setGameForm] = useState(EMPTY_GAME_FORM);
  const [editingGameId, setEditingGameId] = useState(null);
  const [gameImageError, setGameImageError] = useState("");
  const [hideGameName, setHideGameName] = useState("");
  const [gameBrowseSearch, setGameBrowseSearch] = useState("");
  // The RAWG-sourced "Latest PC & Console Games" / "Upcoming Games" grids
  // aren't stored anywhere — Games.jsx fetches them live and caches the
  // result in this browser's localStorage (gamingverse_rawg_cache_v1) to
  // cut down on repeat RAWG requests. Reusing that same cache here lets
  // this admin's game browser include them too, so Hide/Edit isn't limited
  // to the local curated catalogue. Read once at mount, since it's just a
  // convenience list — if this browser hasn't loaded the Games page
  // recently the cache is empty and the list is simply shorter; the
  // Hide/Edit actions themselves write to Firebase by name and apply for
  // every visitor regardless of this admin's own cache state.
  const [automaticCatalogueGames] = useState(() => {
    try {
      const cached = JSON.parse(
        localStorage.getItem("gamingverse_rawg_cache_v1") || "null",
      );
      return [
        ...(Array.isArray(cached?.automaticGames) ? cached.automaticGames : []),
        ...(Array.isArray(cached?.upcomingGames) ? cached.upcomingGames : []),
      ];
    } catch {
      return [];
    }
  });

  // A curated game with no local art file (no file under assets/horizontal
  // or assets/Posters) shows no poster here for the same reason — on the
  // Games page, the poster-search effect fills those in from RAWG and
  // caches the result under this same key. Reusing it here backfills the
  // thumbnail in this list too, purely cosmetic (Edit/Hide don't need it).
  const [posterImageCache] = useState(() => {
    try {
      const cached = JSON.parse(
        localStorage.getItem("gamingverse_poster_image_cache_v1") || "null",
      );
      return cached && typeof cached === "object" ? cached : {};
    } catch {
      return {};
    }
  });
  // Posters this admin session finds itself (see the lookup effect further
  // down), merged on top of the cache read at mount so the browse list's
  // placeholders fill in live instead of only on the next page load.
  const [resolvedPosterImages, setResolvedPosterImages] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(currentUser);
      try {
        const snap = await get(ref(db, `users/${currentUser.uid}`));
        const data = snap.exists() ? snap.val() : {};
        if (String(data.role || "").toLowerCase() !== "admin") {
          await signOut(auth);
          navigate("/login", { replace: true });
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error("Admin auth check error:", error);
        setMessage("Could not verify admin access.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "users"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data).map(([uid, value]) => ({
          uid,
          ...value,
        }));
        next.sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
        );
        setUsers(next);
      },
      (error) => {
        console.error("Admin users listener error:", error);
        setMessage("Could not load users. Publish database.rules.json.");
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "gameReviews"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const flattened = [];
        Object.entries(data).forEach(([gameId, byUser]) => {
          Object.entries(byUser || {}).forEach(([uid, review]) => {
            if (!review) return;
            const comments = Object.entries(review.comments || {}).map(
              ([commentId, comment]) => ({ id: commentId, ...comment }),
            );
            flattened.push({
              gameId,
              uid,
              gameName: review.gameName || gameId,
              userName: review.userName || "Gamer",
              verdict: review.review || "",
              text: review.text || "",
              createdAt: Number(review.updatedAt || review.createdAt) || 0,
              comments,
            });
          });
        });
        flattened.sort((a, b) => b.createdAt - a.createdAt);
        setReviews(flattened);
      },
      (error) => {
        console.error("Admin reviews listener error:", error);
        setMessage("Could not load reviews.");
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "products"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, product]) => ({ id, ...product }))
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setProducts(next);
      },
      (error) => {
        console.error("Admin products listener error:", error);
        setMessage("Could not load listings.");
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "cafes"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, raw]) => normalizeCafe(id, raw))
          .filter(Boolean)
          .sort((a, b) => b.createdAt - a.createdAt);
        setCafes(next);
      },
      (error) => {
        console.error("Admin cafes listener error:", error);
        setMessage("Could not load café listings.");
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "adminGames"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, game]) => ({ id, ...game }))
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setGames(next);
      },
      (error) => {
        console.error("Admin games listener error:", error);
        setMessage("Could not load games.");
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "hiddenGames"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([key, value]) => ({ key, ...value }))
          .sort((a, b) => Number(b.hiddenAt || 0) - Number(a.hiddenAt || 0));
        setHiddenGames(next);
      },
      (error) => {
        console.error("Admin hidden games listener error:", error);
        setMessage("Could not load hidden games.");
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "cafeBookings"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const flattened = [];
        Object.values(data).forEach((customerBookings) => {
          Object.values(customerBookings || {}).forEach((booking) => {
            flattened.push(booking);
          });
        });
        setBookingCount(flattened.length);
        setBookings(flattened);
      },
      (error) => {
        console.error("Admin bookings listener error:", error);
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return undefined;
    const unsubscribe = onValue(
      ref(db, "orders"),
      (snapshot) => {
        const data = snapshot.val() || {};
        setOrders(Object.values(data));
      },
      (error) => {
        console.error("Admin orders listener error:", error);
      },
    );
    return () => unsubscribe();
  }, [authorized]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (u.uid === user?.uid) return false;
      const banned = Boolean(u.isBanned);
      if (userFilter === "banned" && !banned) return false;
      if (userFilter === "active" && banned) return false;
      if (!q) return true;
      const haystack = `${u.username || ""} ${u.firstName || ""} ${u.lastName || ""} ${u.email || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, userSearch, userFilter, user]);

  const bannedCount = users.filter((u) => u.isBanned).length;

  // Every game the Games page can show — curated catalogue entries plus
  // this browser's cached RAWG results — with any admin edit already
  // merged in (same override-by-name logic Games.jsx uses), so Edit always
  // opens with the game's current effective data and saving again updates
  // that same override instead of creating a duplicate.
  const browsableGames = useMemo(() => {
    const adminByKey = new Map(
      games.map((game) => [normalizeGameSearchText(game.name), game]),
    );
    const hiddenKeys = new Set(hiddenGames.map((entry) => entry.key));
    const seen = new Set();

    const withOverride = (game, fallbackId) => {
      const key = normalizeGameSearchText(game.name);
      const override = adminByKey.get(key);
      const image =
        override?.image ||
        game.image ||
        resolvedPosterImages[normalizeCatalogueImageKey(game.name)] ||
        posterImageCache[normalizeCatalogueImageKey(game.name)] ||
        "";
      return {
        ...game,
        ...override,
        image,
        id: override?.id || fallbackId,
        isHidden: hiddenKeys.has(key),
      };
    };

    const curated = completeGameCatalogue.map((game) => {
      const key = normalizeGameSearchText(game.name);
      seen.add(key);
      return withOverride(game, `curated-${key}`);
    });

    const automatic = automaticCatalogueGames
      .filter((game) => {
        const key = normalizeGameSearchText(game.name);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((game) =>
        withOverride(
          { ...game, genre: game.genre || "Game (AUTO)" },
          `auto-${normalizeGameSearchText(game.name)}`,
        ),
      );

    return [...curated, ...automatic];
  }, [
    games,
    hiddenGames,
    automaticCatalogueGames,
    posterImageCache,
    resolvedPosterImages,
  ]);

  const filteredBrowsableGames = useMemo(() => {
    const q = gameBrowseSearch.trim().toLowerCase();
    if (!q) return browsableGames;
    return browsableGames.filter((game) =>
      game.name.toLowerCase().includes(q),
    );
  }, [browsableGames, gameBrowseSearch]);

  // Resolve posters for whatever's missing one, same search Games.jsx
  // uses (utils/posterLookup.js) — this used to only ever happen on the
  // Games page itself, so a curated game with no local art stayed a blank
  // placeholder here until someone loaded that page first. Runs only while
  // the Games section is open, and only for names not already in the
  // localStorage cache, since a poster only needs finding once, ever.
  useEffect(() => {
    if (section !== "games") return undefined;

    let cancelled = false;
    const missing = filteredBrowsableGames.filter((game) => !game.image);
    if (missing.length) {
      lookupMissingPosters(missing, posterImageCache, {
        isCancelled: () => cancelled,
        onBatchFound: (batchFound) => {
          if (!cancelled) {
            setResolvedPosterImages((prev) => ({ ...prev, ...batchFound }));
          }
        },
      });
    }

    return () => {
      cancelled = true;
    };
    // Only re-run when the search changes the missing set, not on every
    // resolvedPosterImages update (that would re-trigger this same effect).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, gameBrowseSearch]);

  // Daily counts for the last 14 days, for the Overview activity chart.
  const activityDays = useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(PAGE_LOAD_TIME - (13 - index) * DAY_MS);
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        signups: 0,
        bookings: 0,
        orders: 0,
      };
    });
    const byKey = new Map(days.map((day) => [day.key, day]));
    const bump = (timestamp, field) => {
      if (!timestamp) return;
      const key = new Date(Number(timestamp)).toISOString().slice(0, 10);
      const day = byKey.get(key);
      if (day) day[field] += 1;
    };
    users.forEach((u) => bump(u.createdAt, "signups"));
    bookings.forEach((b) => bump(b.createdAt, "bookings"));
    orders.forEach((o) => bump(o.createdAt, "orders"));
    return days;
  }, [users, bookings, orders]);

  const setBanned = async (uid, banned) => {
    try {
      await set(ref(db, `users/${uid}/isBanned`), banned);
      setMessage(banned ? "User banned." : "User unbanned.");
    } catch (error) {
      console.error("Ban toggle error:", error);
      setMessage("Could not update user ban status.");
    }
  };

  const deleteReview = async (gameId, uid) => {
    if (!window.confirm("Delete this review and its comments?")) return;
    try {
      await remove(ref(db, `gameReviews/${gameId}/${uid}`));
      setMessage("Review deleted.");
    } catch (error) {
      console.error("Delete review error:", error);
      setMessage("Could not delete review.");
    }
  };

  const deleteComment = async (gameId, uid, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await remove(ref(db, `gameReviews/${gameId}/${uid}/comments/${commentId}`));
      setMessage("Comment deleted.");
    } catch (error) {
      console.error("Delete comment error:", error);
      setMessage("Could not delete comment.");
    }
  };

  const setCafeStatus = async (cafeId, status) => {
    try {
      await set(ref(db, `cafes/${cafeId}/status`), status);
      setMessage(
        status === "approved"
          ? "Café approved — now visible to customers."
          : status === "rejected"
            ? "Café rejected."
            : "Café moved back to pending review.",
      );
    } catch (error) {
      console.error("Café status update error:", error);
      setMessage("Could not update café status.");
    }
  };

  const deleteListing = async (productId, name) => {
    if (!window.confirm(`Delete listing "${name}"?`)) return;
    try {
      await remove(ref(db, `products/${productId}`));
      setMessage("Listing removed.");
    } catch (error) {
      console.error("Delete listing error:", error);
      setMessage("Could not delete listing.");
    }
  };

  const resetGameForm = () => {
    setGameForm(EMPTY_GAME_FORM);
    setEditingGameId(null);
    setGameImageError("");
  };

  const startEditGame = (game) => {
    setGameForm({
      name: game.name || "",
      image: game.image || "",
      genre: game.genre || "",
      platforms: game.platforms || "",
      releaseDate: game.releaseDate || "",
      developer: game.developer || "",
      publisher: game.publisher || "",
      description: game.description || "",
    });
    setEditingGameId(game.id);
    setGameImageError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveGame = async (event) => {
    event.preventDefault();
    const name = gameForm.name.trim();
    if (!name || !gameForm.image) {
      setMessage("A game needs at least a name and a poster image.");
      return;
    }
    try {
      const gameId = editingGameId || push(ref(db, "adminGames")).key;
      await set(ref(db, `adminGames/${gameId}`), {
        ...gameForm,
        name,
        createdAt: editingGameId
          ? games.find((g) => g.id === editingGameId)?.createdAt || Date.now()
          : Date.now(),
        updatedAt: Date.now(),
      });
      setMessage(editingGameId ? "Game updated." : "Game added.");
      resetGameForm();
    } catch (error) {
      console.error("Save game error:", error);
      setMessage("Could not save the game.");
    }
  };

  const deleteGame = async (gameId, name) => {
    if (!window.confirm(`Delete "${name}" from the catalogue?`)) return;
    try {
      await remove(ref(db, `adminGames/${gameId}`));
      setMessage("Game deleted.");
      if (editingGameId === gameId) resetGameForm();
    } catch (error) {
      console.error("Delete game error:", error);
      setMessage("Could not delete the game.");
    }
  };

  const hideGameByName = async (name) => {
    try {
      await set(ref(db, `hiddenGames/${normalizeGameSearchText(name)}`), {
        name,
        hiddenAt: Date.now(),
      });
      setMessage(`"${name}" is now hidden from the site.`);
    } catch (error) {
      console.error("Hide game error:", error);
      setMessage("Could not hide that game.");
    }
  };

  const hideGame = async (event) => {
    event.preventDefault();
    const name = hideGameName.trim();
    if (!name) return;
    await hideGameByName(name);
    setHideGameName("");
  };

  const unhideGame = async (key, name) => {
    try {
      await remove(ref(db, `hiddenGames/${key}`));
      setMessage(`"${name}" is visible again.`);
    } catch (error) {
      console.error("Unhide game error:", error);
      setMessage("Could not unhide that game.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  if (loading) return <PageSkeleton variant="list" />;
  if (!user || !authorized) return null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <span className="admin-kicker">GAMINGVERSE ADMIN</span>
          <h1>Admin Panel</h1>
          <p>Site-wide moderation and oversight.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" onClick={() => navigate("/games")}>
            GamingVerse
          </button>
          <button type="button" className="admin-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {["overview", "users", "reviews", "listings", "cafes", "games"].map(
          (item) => (
            <button
              key={item}
              type="button"
              className={section === item ? "active" : ""}
              onClick={() => setSection(item)}
            >
              {item === "overview"
                ? "Overview"
                : item === "users"
                  ? "👥 Users"
                  : item === "reviews"
                    ? "💬 Reviews"
                    : item === "listings"
                      ? "🛒 Listings"
                      : item === "cafes"
                        ? `☕ Cafés${
                            cafes.filter((c) => c.status === "pending").length
                              ? ` (${cafes.filter((c) => c.status === "pending").length})`
                              : ""
                          }`
                        : "🎮 Games"}
            </button>
          ),
        )}
      </nav>

      {message && (
        <div className="admin-message">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      {section === "overview" && (
        <main className="admin-main gv-page-enter">
          <section className="admin-stat-grid">
            <article>
              <span>Total Users</span>
              <strong>{users.length}</strong>
              <small>{bannedCount} banned</small>
            </article>
            <article>
              <span>Reviews</span>
              <strong>{reviews.length}</strong>
              <small>across all games</small>
            </article>
            <article>
              <span>Marketplace Listings</span>
              <strong>{products.length}</strong>
              <small>live products &amp; CDs</small>
            </article>
            <article>
              <span>Café Bookings</span>
              <strong>{bookingCount}</strong>
              <small>all-time</small>
            </article>
            <article>
              <span>Cafés</span>
              <strong>{cafes.length}</strong>
              <small>
                {cafes.filter((c) => c.status === "pending").length} awaiting
                review
              </small>
            </article>
          </section>

          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">TRENDS</span>
              <h2>Activity, last 14 days</h2>
              <p>Signups, café bookings and marketplace orders, by day.</p>
            </div>
          </section>
          <AdminActivityChart days={activityDays} />
        </main>
      )}

      {section === "users" && (
        <main className="admin-main gv-page-enter">
          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">USER MANAGEMENT</span>
              <h2>Manage Users</h2>
              <p>Search accounts and ban or unban abusive users.</p>
            </div>
            <div className="admin-mini-stat">
              <strong>{users.length}</strong>
              <span>Total users</span>
            </div>
          </section>

          <section className="admin-filters-row">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search name or email..."
            />
            <div className="admin-filter-chips">
              {["all", "active", "banned"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={userFilter === item ? "active" : ""}
                  onClick={() => setUserFilter(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="admin-table-card">
            {filteredUsers.length === 0 ? (
              <div className="admin-empty">
                <span>👥</span>
                <strong>No users match</strong>
                <p>Try a different search or filter.</p>
              </div>
            ) : (
              <div className="admin-user-list">
                {filteredUsers.map((u) => {
                  const name =
                    u.username ||
                    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                    "GamingVerse User";
                  return (
                    <article
                      key={u.uid}
                      className={`admin-user-row${u.isBanned ? " is-banned" : ""}`}
                    >
                      <div className="admin-user-info">
                        <strong>{name}</strong>
                        <span>{u.email || "No email on file"}</span>
                        {u.role && <small className="admin-role-tag">{u.role}</small>}
                      </div>
                      <div className="admin-row-actions">
                        {u.isBanned ? (
                          <button
                            type="button"
                            className="admin-unban-btn"
                            onClick={() => setBanned(u.uid, false)}
                          >
                            ✓ Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="danger"
                            onClick={() => setBanned(u.uid, true)}
                          >
                            🚫 Ban
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {section === "reviews" && (
        <main className="admin-main gv-page-enter">
          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">MODERATION</span>
              <h2>Reviews &amp; Comments</h2>
              <p>Remove reviews or comments that break GamingVerse guidelines.</p>
            </div>
            <div className="admin-mini-stat">
              <strong>{reviews.length}</strong>
              <span>Total reviews</span>
            </div>
          </section>

          <section className="admin-table-card">
            {reviews.length === 0 ? (
              <div className="admin-empty">
                <span>💬</span>
                <strong>No reviews yet</strong>
              </div>
            ) : (
              <div className="admin-user-list">
                {reviews.map((r) => (
                  <article key={`${r.gameId}-${r.uid}`} className="admin-review-row">
                    <div className="admin-review-info">
                      <div className="admin-review-head">
                        <strong>{r.userName}</strong>
                        <span className={`admin-verdict-pill ${r.verdict}`}>
                          {r.verdict}
                        </span>
                        <small>on {r.gameName}</small>
                      </div>
                      {r.text && <p>{r.text}</p>}
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() => deleteReview(r.gameId, r.uid)}
                      >
                        Delete review
                      </button>
                    </div>
                    {r.comments.length > 0 && (
                      <ul className="admin-comment-list">
                        {r.comments.map((c) => (
                          <li key={c.id}>
                            <span>
                              <strong>{c.userName || "Gamer"}:</strong> {c.text}
                            </span>
                            <button
                              type="button"
                              className="danger-link"
                              onClick={() => deleteComment(r.gameId, r.uid, c.id)}
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {section === "listings" && (
        <main className="admin-main gv-page-enter">
          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">MODERATION</span>
              <h2>Marketplace Listings</h2>
              <p>Remove listings that violate GamingVerse guidelines.</p>
            </div>
            <div className="admin-mini-stat">
              <strong>{products.length}</strong>
              <span>Total listings</span>
            </div>
          </section>

          <section className="admin-table-card">
            {products.length === 0 ? (
              <div className="admin-empty">
                <span>🛒</span>
                <strong>No listings yet</strong>
              </div>
            ) : (
              <div className="admin-user-list">
                {products.map((p) => (
                  <article key={p.id} className="admin-listing-row">
                    <div className="admin-listing-thumb">
                      {p.image ? <img src={p.image} alt="" /> : <span>🎮</span>}
                    </div>
                    <div className="admin-review-info">
                      <strong>{p.name}</strong>
                      <span>
                        {p.category} • ₹{Number(p.price || 0).toLocaleString("en-IN")}{" "}
                        • by {p.sellerName || "Unknown seller"}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteListing(p.id, p.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {section === "cafes" && (
        <main className="admin-main gv-page-enter">
          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">MODERATION</span>
              <h2>Café Listings</h2>
              <p>
                Approve a new café before customers can find and book it, or
                reject one that shouldn't be listed.
              </p>
            </div>
            <div className="admin-mini-stat">
              <strong>{cafes.length}</strong>
              <span>Total cafés</span>
            </div>
          </section>

          <section className="admin-table-card">
            {cafes.length === 0 ? (
              <div className="admin-empty">
                <span>☕</span>
                <strong>No cafés listed yet</strong>
              </div>
            ) : (
              <div className="admin-user-list">
                {cafes.map((cafe) => (
                  <article key={cafe.id} className="admin-listing-row">
                    <div className="admin-listing-thumb">
                      {cafe.photos[0] ? (
                        <img src={cafe.photos[0]} alt="" />
                      ) : (
                        <span>☕</span>
                      )}
                    </div>
                    <div className="admin-review-info">
                      <div className="admin-review-head">
                        <strong>{cafe.name}</strong>
                        <span
                          className={`admin-cafe-status-pill ${cafe.status}`}
                        >
                          {cafe.status}
                        </span>
                      </div>
                      <span>{cafe.address || "No address on file"}</span>
                    </div>
                    <div className="admin-row-actions">
                      {cafe.status !== "approved" && (
                        <button
                          type="button"
                          className="admin-unban-btn"
                          onClick={() => setCafeStatus(cafe.id, "approved")}
                        >
                          ✓ Approve
                        </button>
                      )}
                      {cafe.status !== "rejected" && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => setCafeStatus(cafe.id, "rejected")}
                        >
                          ✕ Reject
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {section === "games" && (
        <main className="admin-main gv-page-enter">
          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">CATALOGUE</span>
              <h2>Games</h2>
              <p>
                Add a brand-new game, or type the exact name of an existing
                RAWG/database game below to override its details — either
                way it's saved here and can be edited or deleted any time.
              </p>
            </div>
            <div className="admin-mini-stat">
              <strong>{games.length}</strong>
              <span>Admin games</span>
            </div>
          </section>

          <form className="admin-game-form" onSubmit={saveGame}>
            <h3>{editingGameId ? "Edit game" : "Add a new game"}</h3>

            <div className="admin-game-form-grid">
              <label>
                <span>Name</span>
                <input
                  value={gameForm.name}
                  onChange={(e) =>
                    setGameForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Game name"
                  required
                />
              </label>

              <label>
                <span>Genre</span>
                <input
                  value={gameForm.genre}
                  onChange={(e) =>
                    setGameForm((f) => ({ ...f, genre: e.target.value }))
                  }
                  placeholder="Action, RPG, Adventure..."
                />
              </label>

              <label>
                <span>Platforms</span>
                <input
                  value={gameForm.platforms}
                  onChange={(e) =>
                    setGameForm((f) => ({ ...f, platforms: e.target.value }))
                  }
                  placeholder="PC • PS5 • Xbox Series X"
                />
              </label>

              <label>
                <span>Release date</span>
                <input
                  value={gameForm.releaseDate}
                  onChange={(e) =>
                    setGameForm((f) => ({
                      ...f,
                      releaseDate: e.target.value,
                    }))
                  }
                  placeholder="2026 or 12 Mar 2026"
                />
              </label>

              <label>
                <span>Developer</span>
                <input
                  value={gameForm.developer}
                  onChange={(e) =>
                    setGameForm((f) => ({ ...f, developer: e.target.value }))
                  }
                />
              </label>

              <label>
                <span>Publisher</span>
                <input
                  value={gameForm.publisher}
                  onChange={(e) =>
                    setGameForm((f) => ({ ...f, publisher: e.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea
                value={gameForm.description}
                onChange={(e) =>
                  setGameForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="What's this game about?"
              />
            </label>

            <div className="image-field-row">
              <input
                value={gameForm.image}
                onChange={(e) =>
                  setGameForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="Poster image URL, or upload one"
              />
              <ImageUploadButton
                pathPrefix={`gameImages/${user.uid}`}
                onUploaded={(url) =>
                  setGameForm((f) => ({ ...f, image: url }))
                }
                onError={setGameImageError}
              />
            </div>
            {gameImageError && (
              <p className="image-field-error">{gameImageError}</p>
            )}
            {gameForm.image && (
              <img
                className="admin-game-image-preview"
                src={gameForm.image}
                alt=""
              />
            )}

            <div className="admin-game-form-actions">
              <button type="submit" className="admin-unban-btn">
                {editingGameId ? "Save changes" : "Add game"}
              </button>
              {editingGameId && (
                <button type="button" onClick={resetGameForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <section className="admin-table-card">
            {games.length === 0 ? (
              <div className="admin-empty">
                <span>🎮</span>
                <strong>No admin-added games yet</strong>
                <p>Games added above will show up here.</p>
              </div>
            ) : (
              <div className="admin-user-list">
                {games.map((game) => (
                  <article key={game.id} className="admin-listing-row">
                    <div className="admin-listing-thumb">
                      {game.image ? (
                        <img src={game.image} alt="" />
                      ) : (
                        <span>🎮</span>
                      )}
                    </div>
                    <div className="admin-review-info">
                      <strong>{game.name}</strong>
                      <span>
                        {game.genre || "Game"}
                        {game.releaseDate ? ` • ${game.releaseDate}` : ""}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        onClick={() => startEditGame(game)}
                      >
                        ✎ Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteGame(game.id, game.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">CATALOGUE</span>
              <h2>Browse all games</h2>
              <p>
                Every game currently shown on the Games page — click Edit to
                change its details or Hide to remove it from the site.
              </p>
            </div>
            <div className="admin-mini-stat">
              <strong>{browsableGames.length}</strong>
              <span>Games</span>
            </div>
          </section>

          <section className="admin-filters-row">
            <input
              value={gameBrowseSearch}
              onChange={(e) => setGameBrowseSearch(e.target.value)}
              placeholder="Search a game..."
            />
          </section>

          <section className="admin-table-card">
            {filteredBrowsableGames.length === 0 ? (
              <div className="admin-empty">
                <span>🎮</span>
                <strong>No games match that search</strong>
              </div>
            ) : (
              <div className="admin-user-list">
                {filteredBrowsableGames.map((game) => (
                  <article key={game.id} className="admin-listing-row">
                    <div className="admin-listing-thumb">
                      {game.image ? (
                        <img src={game.image} alt="" />
                      ) : (
                        <span>🎮</span>
                      )}
                    </div>
                    <div className="admin-review-info">
                      <strong>
                        {game.name}
                        {game.source === "RAWG" ? " · AUTO" : ""}
                      </strong>
                      <span>
                        {game.genre || "Game"}
                        {game.releaseDate ? ` • ${game.releaseDate}` : ""}
                        {game.isHidden ? " • Hidden" : ""}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        onClick={() => startEditGame(game)}
                      >
                        ✎ Edit
                      </button>
                      {game.isHidden ? (
                        <button
                          type="button"
                          className="admin-unban-btn"
                          onClick={() =>
                            unhideGame(
                              normalizeGameSearchText(game.name),
                              game.name,
                            )
                          }
                        >
                          ✓ Unhide
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => hideGameByName(game.name)}
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-section-head">
            <div>
              <span className="admin-kicker">MODERATION</span>
              <h2>Hide a game</h2>
              <p>
                Remove any game from the site by its exact name — this
                works for RAWG and database games too, not just the ones
                added above.
              </p>
            </div>
            <div className="admin-mini-stat">
              <strong>{hiddenGames.length}</strong>
              <span>Hidden games</span>
            </div>
          </section>

          <form className="admin-game-form admin-hide-game-form" onSubmit={hideGame}>
            <input
              value={hideGameName}
              onChange={(e) => setHideGameName(e.target.value)}
              placeholder="Exact game name, e.g. Red Dead Redemption 2"
            />
            <button type="submit" className="danger">
              Hide game
            </button>
          </form>

          <section className="admin-table-card">
            {hiddenGames.length === 0 ? (
              <div className="admin-empty">
                <span>🙈</span>
                <strong>No hidden games</strong>
              </div>
            ) : (
              <div className="admin-user-list">
                {hiddenGames.map((hidden) => (
                  <article key={hidden.key} className="admin-user-row">
                    <div className="admin-user-info">
                      <strong>{hidden.name}</strong>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-unban-btn"
                        onClick={() => unhideGame(hidden.key, hidden.name)}
                      >
                        ✓ Unhide
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
