import { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, onValue, ref, remove, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import PageSkeleton from "../components/PageSkeleton.jsx";
import { normalizeCafe } from "./cafe/utils/cafeModel.js";

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

  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all"); // all | banned | active

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
      ref(db, "cafeBookings"),
      (snapshot) => {
        const data = snapshot.val() || {};
        let count = 0;
        Object.values(data).forEach((customerBookings) => {
          count += Object.keys(customerBookings || {}).length;
        });
        setBookingCount(count);
      },
      (error) => {
        console.error("Admin bookings listener error:", error);
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
        {["overview", "users", "reviews", "listings", "cafes"].map((item) => (
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
                    : `☕ Cafés${
                        cafes.filter((c) => c.status === "pending").length
                          ? ` (${cafes.filter((c) => c.status === "pending").length})`
                          : ""
                      }`}
          </button>
        ))}
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
        <main className="admin-main">
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
        </main>
      )}

      {section === "users" && (
        <main className="admin-main">
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
        <main className="admin-main">
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
        <main className="admin-main">
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
        <main className="admin-main">
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
    </div>
  );
}
