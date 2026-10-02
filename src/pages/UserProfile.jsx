/* =========================================================
   USER PROFILE  (/user/:uid)
   Another gamer's public page: their card (publicProfiles),
   followers / following, a Follow button, their feed posts and
   their game reviews. Nothing private (phone, email, age) is
   shown — users/{uid} stays owner-only.
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  equalTo,
  get,
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  serverTimestamp,
  update,
} from "firebase/database";
import { auth, db } from "../firebase";
import { NOTIFY_TITLES, notifyUser } from "../utils/notify.js";
import { toPublicProfile } from "../utils/publicProfile.js";
import AppTopNav from "../components/AppTopNav.jsx";
import AppBottomNav from "../components/AppBottomNav.jsx";
import GVLogoMark from "../components/GVLogoMark.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";
import { formatGameName } from "./profile/utils/gameImages.js";
import useRemotePosters from "./profile/utils/useRemotePosters.js";
import "./Profile.css";
import "./profile/styles/user-profile.css";

const POST_LIMIT = 30;
const VERDICT_LABEL = {
  perfection: "PERFECTION",
  "go-for-it": "GO FOR IT",
  timepass: "TIMEPASS",
  skip: "SKIP",
};

function timeAgo(value) {
  const ms = Date.now() - Number(value || 0);
  if (!value || ms < 3600000) return "Just now";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Opening another gamer's page starts fresh (no leftovers from the last one).
export default function UserProfile() {
  const { uid } = useParams();
  return <UserProfilePage key={uid} uid={uid} />;
}

function UserProfilePage({ uid }) {
  const navigate = useNavigate();

  const [me, setMe] = useState(undefined); // undefined = still loading
  const [card, setCard] = useState(null);
  const [cardLoaded, setCardLoaded] = useState(false);
  const [followers, setFollowers] = useState({});
  const [following, setFollowing] = useState({});
  const [posts, setPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("posts");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* Who is looking (needed for the Follow button). */
  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setMe(null);
          return;
        }
        let data = {};
        try {
          data = (await get(ref(db, `users/${user.uid}`))).val() || {};
        } catch {
          // fall back to auth info
        }
        const pub = toPublicProfile(data, user);
        setMe({ uid: user.uid, name: pub.name, handle: pub.handle });
      }),
    [],
  );

  const ready = Boolean(me && uid && me.uid !== uid);

  /* Their public card. */
  useEffect(() => {
    if (!ready) return undefined;
    return onValue(
      ref(db, `publicProfiles/${uid}`),
      (snap) => {
        setCard(snap.val());
        setCardLoaded(true);
      },
      (err) => {
        console.warn("Public profile load error:", err);
        setCardLoaded(true);
      },
    );
  }, [ready, uid]);

  /* Followers / following (live). */
  useEffect(() => {
    if (!ready) return undefined;
    const stopA = onValue(
      ref(db, `followers/${uid}`),
      (snap) => setFollowers(snap.val() || {}),
      (err) => console.warn("Followers load error:", err),
    );
    const stopB = onValue(
      ref(db, `follows/${uid}`),
      (snap) => setFollowing(snap.val() || {}),
      (err) => console.warn("Following load error:", err),
    );
    return () => {
      stopA();
      stopB();
    };
  }, [ready, uid]);

  /* Their posts, newest first. */
  useEffect(() => {
    if (!ready) return undefined;
    return onValue(
      query(ref(db, "posts"), orderByChild("uid"), equalTo(uid), limitToLast(POST_LIMIT)),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        setPosts(list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      },
      (err) => console.warn("User posts load error:", err),
    );
  }, [ready, uid]);

  /* Their reviews: userReviews/{uid} lists the games, then each review. */
  useEffect(() => {
    if (!ready) return undefined;
    let active = true;
    const stop = onValue(
      ref(db, `userReviews/${uid}`),
      async (snap) => {
        const gameIds = Object.keys(snap.val() || {}).filter((key) => !key.startsWith("_"));
        const list = await Promise.all(
          gameIds.map((gameId) =>
            get(ref(db, `gameReviews/${gameId}/${uid}`))
              .then((s) => {
                const r = s.val();
                if (!r?.review) return null;
                const raw = r.gameName || gameId;
                return {
                  id: gameId,
                  rawGameName: raw,
                  gameName: formatGameName(raw),
                  gameImage: r.gameImage || "",
                  verdict: r.review,
                  text: String(r.text || "").trim(),
                  createdAt: Number(r.updatedAt || r.createdAt) || 0,
                  likes: Object.keys(r.likes || {}).length,
                };
              })
              .catch(() => null),
          ),
        );
        if (active) {
          setReviews(list.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt));
        }
      },
      (err) => console.warn("User reviews load error:", err),
    );
    return () => {
      active = false;
      stop();
    };
  }, [ready, uid]);

  // Older accounts may not have a card yet: borrow the author details
  // copied into their latest post.
  const profile = useMemo(() => {
    if (card?.name) return card;
    const post = posts[0];
    if (post?.authorName) {
      return {
        name: post.authorName,
        handle: post.authorHandle || "",
        photo: post.authorPhoto || "",
        bio: "",
      };
    }
    return null;
  }, [card, posts]);

  const posterFor = useRemotePosters(reviews.map((review) => review.rawGameName));

  if (!uid) return <Navigate to="/games" replace />;
  if (me === undefined) return <PageSkeleton variant="list" />;
  if (me === null) return <Navigate to="/login" replace />;
  if (me.uid === uid) return <Navigate to="/profile" replace />;

  const isFollowing = Boolean(followers[me.uid]);
  const followerCount = Object.keys(followers).length;
  const followingCount = Object.keys(following).length;
  const name = profile?.name || "Gamer";
  const handle = profile?.handle || "";

  async function toggleFollow() {
    if (busy) return;
    setBusy(true);
    setError("");
    const updates = isFollowing
      ? { [`follows/${me.uid}/${uid}`]: null, [`followers/${uid}/${me.uid}`]: null }
      : {
          [`follows/${me.uid}/${uid}`]: {
            name: name.slice(0, 80),
            handle: handle.slice(0, 30),
            createdAt: serverTimestamp(),
          },
          [`followers/${uid}/${me.uid}`]: {
            name: me.name.slice(0, 80),
            handle: me.handle.slice(0, 30),
            createdAt: serverTimestamp(),
          },
        };
    try {
      await update(ref(db), updates);
      if (!isFollowing) {
        notifyUser(uid, `${me.name} started following you.`, NOTIFY_TITLES.feed);
      }
    } catch (err) {
      console.error("Follow error:", err);
      setError("Couldn't update follow. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const notFound = cardLoaded && !profile && posts.length === 0 && reviews.length === 0;

  return (
    <div className="profile-page user-profile-page">
      <header className="profile-header">
        <button
          className="profile-logo"
          type="button"
          onClick={() => navigate("/games")}
          aria-label="Go to GamingVerse home"
        >
          <span className="profile-logo-icon gv-logo-host" aria-hidden="true">
            <GVLogoMark />
          </span>
          <span className="profile-logo-text">
            <strong>
              Gaming<span>Verse</span>
            </strong>
          </span>
        </button>
        <AppTopNav />
      </header>

      <main className="profile-content gv-page-enter">
        <section className="profile-left-card">
          <div className="profile-cover" aria-hidden="true" />
          <div className="profile-avatar">
            {profile?.photo ? (
              <img src={profile.photo} alt="" />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <h1>{notFound ? "Gamer not found" : name}</h1>
          {handle && <p className="profile-username">@{handle}</p>}
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div>
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{reviews.length}</strong>
              <span>Reviews</span>
            </div>
          </div>

          <div className="profile-social">
            <div className="profile-social-tile">
              <strong>{followerCount}</strong>
              <span>Followers</span>
            </div>
            <div className="profile-social-tile">
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>
          </div>

          {!notFound && (
            <button
              type="button"
              className={`up-follow-btn${isFollowing ? " is-following" : ""}`}
              onClick={toggleFollow}
              disabled={busy}
              aria-pressed={isFollowing}
            >
              {isFollowing ? "✓ Following" : "＋ Follow"}
            </button>
          )}
          {error && <p className="up-error">{error}</p>}

          <button type="button" className="logout-profile-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </section>

        <section className="profile-middle">
          <div className="profile-tabs up-tabs">
            <button
              type="button"
              className={tab === "posts" ? "profile-tab active" : "profile-tab"}
              onClick={() => setTab("posts")}
            >
              📸 <span>Posts</span>
            </button>
            <button
              type="button"
              className={tab === "reviews" ? "profile-tab active" : "profile-tab"}
              onClick={() => setTab("reviews")}
            >
              ✍️ <span>Reviews</span>
            </button>
          </div>

          {tab === "posts" ? (
            posts.length === 0 ? (
              <div className="up-empty">
                <div aria-hidden="true">📸</div>
                <h3>No posts yet</h3>
                <p>{name} hasn't shared anything in the feed.</p>
              </div>
            ) : (
              <div className="up-post-grid">
                {posts.map((post) => (
                  <button
                    type="button"
                    key={post.id}
                    className="up-post-tile"
                    onClick={() => navigate(`/games?view=spaces&post=${post.id}`)}
                    aria-label={post.caption || "Open post"}
                  >
                    <img src={post.imageData || post.imageURL} alt="" loading="lazy" />
                    {post.game && <span className="up-post-game">🎮 {post.game}</span>}
                  </button>
                ))}
              </div>
            )
          ) : reviews.length === 0 ? (
            <div className="up-empty">
              <div aria-hidden="true">✍️</div>
              <h3>No reviews yet</h3>
              <p>{name} hasn't reviewed any games.</p>
            </div>
          ) : (
            <div className="my-reviews-list">
              {reviews.map((review) => {
                const poster = posterFor(review.rawGameName, review.gameImage);
                return (
                  <article
                    key={review.id}
                    className={`my-review-card my-review-card-clickable verdict-${review.verdict}`}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/games?openGame=${encodeURIComponent(review.gameName)}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        navigate(`/games?openGame=${encodeURIComponent(review.gameName)}`);
                      }
                    }}
                  >
                    <div className="my-review-head">
                      <div className="my-review-game">
                        <div className="my-review-game-icon">
                          {poster ? (
                            <img src={poster} alt={review.gameName} loading="lazy" />
                          ) : (
                            <span aria-hidden="true">🎮</span>
                          )}
                        </div>
                        <div>
                          <h3>{review.gameName}</h3>
                          <span>{timeAgo(review.createdAt)}</span>
                        </div>
                      </div>
                      <span className={`my-review-verdict ${review.verdict}`}>
                        {VERDICT_LABEL[review.verdict] || "REVIEW"}
                      </span>
                    </div>
                    {review.text && <p className="my-review-text">{review.text}</p>}
                    <div className="my-review-footer">
                      <span>♡ {review.likes}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
}
