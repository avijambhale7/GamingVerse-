/* =========================================================
   USER FEED
   Instagram-style community feed for Spaces → Feed: gamers
   post a photo with a caption, others like it (heart or
   double-tap) and comment. Authors and admins can delete.

   posts/{postId}                 the post (author info copied in,
                                  since users/{uid} is private)
   postLikes/{postId}/{uid}       true
   postComments/{postId}/{id}     { uid, text, authorName, ... }
   postReports/{postId}/{uid}     { reason, createdAt } (admins read)
   follows/{uid}/{targetUid}      who I follow (+ followers/{target}/{uid})

   Photos are stored inside the post as a compressed JPEG data
   URL (imageData), because this Firebase project has no
   Storage bucket (Storage needs the paid Blaze plan).
========================================================= */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  get,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../../firebase";
import {
  NOTIFY_TITLES,
  notifyAdmins,
  notifyUser,
} from "../../../utils/notify.js";
import { compressImageToDataUrl } from "../../../utils/imageData.js";
import { syncPublicProfile, userPath } from "../../../utils/publicProfile.js";
import useEscapeKey from "../../../utils/useEscapeKey.js";
import { completeGameCatalogue } from "../utils/catalogue.js";
import "../styles/user-feed.css";
import "../../../components/PageSkeleton.css";

const MAX_CAPTION = 2200;
const MAX_COMMENT = 500;
// Posts load 20 at a time ("Load more" adds 20) — each carries its photo.
const PAGE_SIZE = 20;
// New photos use the "feed" preset (utils/imageData.js: 1080px, ~200 KB),
// well under the imageData limit in database.rules.json (600000).
const REPORT_REASONS = [
  ["spam", "Spam"],
  ["offensive", "Offensive or hateful"],
  ["inappropriate", "Inappropriate image"],
  ["other", "Something else"],
];

// Game names for the "tag a game" picker, de-duplicated.
const GAME_NAMES = [
  ...new Set(completeGameCatalogue.map((game) => game?.name).filter(Boolean)),
].sort((a, b) => a.localeCompare(b));

const findGame = (name) =>
  completeGameCatalogue.find(
    (game) => game?.name?.toLowerCase() === String(name).toLowerCase(),
  ) || { name };

function timeAgo(value) {
  const ms = Date.now() - Number(value || 0);
  if (!value || ms < 60000) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(Number(value)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function initialsOf(name) {
  return (
    String(name || "G")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "G"
  );
}

// A post write should never leave the button stuck on "Sharing…".
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      window.setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

function Avatar({ name, photo, size = 38 }) {
  return (
    <span className="uf-avatar" style={{ width: size, height: size }}>
      {photo ? <img src={photo} alt="" /> : initialsOf(name)}
    </span>
  );
}

export default function UserFeed({ onOpenGame }) {
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  // Set as soon as Firebase restores the session; the feed listeners
  // wait for it, because a read made before sign-in is refused and
  // Firebase then cancels that listener for good.
  const [authUid, setAuthUid] = useState(null);
  const [following, setFollowing] = useState({});
  const [feedTab, setFeedTab] = useState("all");
  // ?post=<id> (a shared link) scrolls to that post once it has loaded.
  const [targetPostId] = useState(() =>
    new URLSearchParams(window.location.search).get("post"),
  );

  const [composerOpen, setComposerOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [gameTag, setGameTag] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  /* Who's posting: author details are copied into each post. */
  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        setAuthUid(user?.uid || null);
        setLoadError("");
        if (!user) {
          setMe(null);
          setLoading(false);
          return;
        }
        let data = {};
        try {
          const snap = await get(ref(db, `users/${user.uid}`));
          data = snap.val() || {};
        } catch (err) {
          console.error("Feed profile load error:", err);
        }
        const name =
          `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "Gamer";
        syncPublicProfile(user.uid, data, user);
        setMe({
          uid: user.uid,
          name,
          handle: data.username || "",
          photo: data.photoURL || user.photoURL || "",
          isAdmin: data.role === "admin",
          isBanned: data.isBanned === true,
        });
      }),
    [],
  );

  useEffect(() => {
    if (!authUid) return undefined;
    const onReadError = (err) => {
      console.error("Feed load error:", err);
      setLoadError(
        String(err?.message || "").includes("permission")
          ? "The feed couldn't load because the latest database rules aren't published yet."
          : "The feed couldn't load. Check your connection and refresh.",
      );
      setLoading(false);
    };
    const stopPosts = onValue(
      query(ref(db, "posts"), orderByChild("createdAt"), limitToLast(limit)),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        setPosts(list.reverse());
        setLoading(false);
      },
      onReadError,
    );
    return () => stopPosts();
  }, [authUid, limit]);

  // Follows are optional extras: a failure here shouldn't hide the feed.
  useEffect(() => {
    if (!authUid) return undefined;
    return onValue(
      ref(db, `follows/${authUid}`),
      (snap) => setFollowing(snap.val() || {}),
      (err) => console.warn("Follows load error:", err),
    );
  }, [authUid]);

  useEffect(() => {
    if (!targetPostId || loading) return;
    document
      .getElementById(`post-${targetPostId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [targetPostId, loading]);

  async function toggleFollow(post) {
    if (!me || post.uid === me.uid) return;
    const isFollowing = Boolean(following[post.uid]);
    const updates = isFollowing
      ? {
          [`follows/${me.uid}/${post.uid}`]: null,
          [`followers/${post.uid}/${me.uid}`]: null,
        }
      : {
          [`follows/${me.uid}/${post.uid}`]: {
            name: String(post.authorName || "").slice(0, 80),
            handle: String(post.authorHandle || "").slice(0, 30),
            createdAt: serverTimestamp(),
          },
          [`followers/${post.uid}/${me.uid}`]: {
            name: me.name.slice(0, 80),
            handle: me.handle.slice(0, 30),
            createdAt: serverTimestamp(),
          },
        };
    try {
      await update(ref(db), updates);
      if (!isFollowing) {
        notifyUser(
          post.uid,
          `${me.name} started following you.`,
          NOTIFY_TITLES.feed,
        );
      }
    } catch (err) {
      console.error("Follow error:", err);
      setError("Couldn't update who you follow. Please try again.");
    }
  }

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pickFile(event) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setComposerOpen(true);
  }

  function resetComposer() {
    setComposerOpen(false);
    setFile(null);
    setPreview("");
    setCaption("");
    setGameTag("");
    setError("");
  }

  async function sharePost() {
    if (!me || !file || posting) return;
    if (me.isBanned) {
      setError("Your account is restricted from posting.");
      return;
    }
    setPosting(true);
    setError("");
    let imageData;
    try {
      imageData = await compressImageToDataUrl(file, "feed");
    } catch (err) {
      console.error("Image compress error:", err);
      setError(
        err.message || "Couldn't read this photo. Try a JPG or PNG image.",
      );
      setPosting(false);
      return;
    }
    const postRef = push(ref(db, "posts"));
    try {
      await withTimeout(
        set(postRef, {
          uid: me.uid,
          imageData,
          caption: caption.trim().slice(0, MAX_CAPTION),
          authorName: me.name.slice(0, 80),
          authorHandle: me.handle.slice(0, 30),
          // Profile photos may themselves be data URLs; skip big ones.
          authorPhoto: me.photo.length <= 2048 ? me.photo : "",
          ...(gameTag.trim() ? { game: gameTag.trim().slice(0, 100) } : {}),
          createdAt: serverTimestamp(),
        }),
        30000,
      );
      resetComposer();
    } catch (err) {
      console.error("Post error:", err);
      setError(
        err.message === "timeout"
          ? "Sharing is taking too long — check your connection and try again."
          : String(err.message || "").includes("PERMISSION_DENIED")
            ? "Posting was blocked. Make sure the latest database rules are published."
            : "Couldn't share your post. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  }

  const composerDisabled = !me || posting;
  const visiblePosts =
    feedTab === "following"
      ? posts.filter((post) => following[post.uid] || post.uid === me?.uid)
      : posts;

  return (
    <main className="trailers-feed user-feed">
      <div className="uf-head">
        <div>
          <span className="section-label">COMMUNITY</span>
          <h1>Feed</h1>
          <p>Share your setups, wins and gaming moments.</p>
        </div>
        <button
          type="button"
          className="uf-new-btn"
          disabled={composerDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          ＋ New post
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={pickFile}
      />

      {composerOpen ? (
        <section className="uf-composer is-open">
          <div className="uf-composer-top">
            <Avatar name={me?.name} photo={me?.photo} />
            <strong>{me?.handle ? `@${me.handle}` : me?.name}</strong>
            <button
              type="button"
              className="uf-link-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={posting}
            >
              Change photo
            </button>
          </div>
          {preview && (
            <div className="uf-preview">
              <img src={preview} alt="Selected upload preview" />
            </div>
          )}
          <textarea
            value={caption}
            maxLength={MAX_CAPTION}
            placeholder="Write a caption…"
            onChange={(e) => setCaption(e.target.value)}
            disabled={posting}
          />
          <label className="uf-game-picker">
            <span aria-hidden="true">🎮</span>
            <input
              list="uf-game-names"
              value={gameTag}
              maxLength={100}
              placeholder="Tag a game (optional)"
              onChange={(e) => setGameTag(e.target.value)}
              disabled={posting}
            />
            <datalist id="uf-game-names">
              {GAME_NAMES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          {error && <p className="uf-error">{error}</p>}
          <div className="uf-composer-actions">
            <small>
              {caption.length}/{MAX_CAPTION}
            </small>
            <button
              type="button"
              className="uf-cancel-btn"
              onClick={resetComposer}
              disabled={posting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="uf-share-btn"
              onClick={sharePost}
              disabled={posting || !file}
            >
              {posting ? "Sharing…" : "Share"}
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className="uf-composer"
          disabled={composerDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar name={me?.name} photo={me?.photo} />
          <span>What are you playing? Share a photo…</span>
          <em aria-hidden="true">📷</em>
        </button>
      )}
      {!composerOpen && error && <p className="uf-error">{error}</p>}

      {authUid && !loadError && (
        <div className="uf-tabs" role="tablist" aria-label="Feed">
          <button
            type="button"
            role="tab"
            aria-selected={feedTab === "all"}
            className={feedTab === "all" ? "is-active" : ""}
            onClick={() => setFeedTab("all")}
          >
            For you
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={feedTab === "following"}
            className={feedTab === "following" ? "is-active" : ""}
            onClick={() => setFeedTab("following")}
          >
            Following
            <small>{Object.keys(following).length}</small>
          </button>
        </div>
      )}

      {loading ? (
        <div className="uf-list" aria-label="Loading feed" aria-busy="true">
          {[0, 1].map((i) => (
            <div className="uf-post uf-skeleton" key={i}>
              <div className="uf-post-head">
                <div className="skeleton-block uf-skel-avatar" />
                <div className="uf-skel-lines">
                  <div className="skeleton-bar skeleton-line" />
                  <div className="skeleton-bar skeleton-line short" />
                </div>
              </div>
              <div className="skeleton-block uf-skel-media" />
              <div className="uf-skel-lines uf-skel-body">
                <div className="skeleton-bar skeleton-line short" />
                <div className="skeleton-bar skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="uf-empty">
          <div>⚠️</div>
          <h3>Feed unavailable</h3>
          <p>{loadError}</p>
        </div>
      ) : !authUid ? (
        <div className="uf-empty">
          <div>🔒</div>
          <h3>Sign in to see the feed</h3>
        </div>
      ) : visiblePosts.length === 0 ? (
        feedTab === "following" ? (
          <div className="uf-empty">
            <div>👥</div>
            <h3>Nothing from people you follow yet</h3>
            <p>
              Tap Follow on a post in For you to see that gamer's posts here.
            </p>
          </div>
        ) : (
          <div className="uf-empty">
            <div>📸</div>
            <h3>No posts yet</h3>
            <p>Be the first to share a gaming moment.</p>
          </div>
        )
      ) : (
        <div className="uf-list">
          {visiblePosts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              me={me}
              isFollowing={Boolean(following[post.uid])}
              onToggleFollow={() => toggleFollow(post)}
              onOpenGame={(name) => onOpenGame?.(findGame(name))}
              highlighted={post.id === targetPostId}
            />
          ))}
          {posts.length >= limit && (
            <button
              type="button"
              className="uf-load-more"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
            >
              Load more posts
            </button>
          )}
        </div>
      )}
    </main>
  );
}

function FeedPost({
  post,
  me,
  isFollowing,
  onToggleFollow,
  onOpenGame,
  highlighted,
}) {
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [burst, setBurst] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState("");
  const commentInputRef = useRef(null);
  const navigate = useNavigate();
  // Your own name opens your profile; anyone else's opens theirs.
  const openUser = (uid) =>
    uid && navigate(me && uid === me.uid ? "/profile" : userPath(uid));
  useEscapeKey(() => setMenuOpen(false), menuOpen);

  // Only this post's likes and comments — not the whole site's.
  useEffect(() => {
    const stopLikes = onValue(
      ref(db, `postLikes/${post.id}`),
      (snap) => setLikes(snap.val() || {}),
      (err) => console.warn("Likes load error:", err),
    );
    const stopComments = onValue(
      ref(db, `postComments/${post.id}`),
      (snap) =>
        setComments(
          Object.entries(snap.val() || {})
            .map(([id, value]) => ({ id, ...value }))
            .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)),
        ),
      (err) => console.warn("Comments load error:", err),
    );
    return () => {
      stopLikes();
      stopComments();
    };
  }, [post.id]);

  const likeCount = Object.keys(likes).length;
  const liked = Boolean(me && likes[me.uid]);
  const canDelete = Boolean(me && (me.uid === post.uid || me.isAdmin));
  const isOwn = Boolean(me && me.uid === post.uid);

  function flash(text) {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function sharePostLink() {
    const url = `${window.location.origin}/games?view=spaces&post=${post.id}`;
    const title = `${post.authorName || "A gamer"} on GamingVerse`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: post.caption || title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch (err) {
      // Closing the share sheet throws AbortError — that's not a failure.
      if (err?.name !== "AbortError") flash("Couldn't share this post");
    }
  }

  async function reportPost(reason) {
    if (!me) return;
    setReporting(false);
    setMenuOpen(false);
    try {
      await set(ref(db, `postReports/${post.id}/${me.uid}`), {
        reason,
        createdAt: serverTimestamp(),
      });
      notifyAdmins(
        `A post by ${post.authorName || "a gamer"} was reported (${reason}).`,
        NOTIFY_TITLES.feed,
      );
      flash("Thanks — our admins will review it");
    } catch (err) {
      console.error("Report error:", err);
      flash(
        String(err?.message || "").includes("PERMISSION_DENIED")
          ? "You've already reported this post"
          : "Couldn't send the report",
      );
    }
  }
  const authorLabel = post.authorHandle || post.authorName || "gamer";

  const visibleComments = useMemo(
    () => (showAll ? comments : comments.slice(-2)),
    [comments, showAll],
  );

  async function toggleLike(forceLike = false) {
    if (!me) return;
    const likeRef = ref(db, `postLikes/${post.id}/${me.uid}`);
    try {
      if (liked && !forceLike) {
        await remove(likeRef);
      } else if (!liked) {
        await set(likeRef, true);
        if (post.uid !== me.uid) {
          notifyUser(
            post.uid,
            `${me.name} liked your post.`,
            NOTIFY_TITLES.feed,
          );
        }
      }
    } catch (err) {
      console.error("Like error:", err);
      flash("Couldn't save your like");
    }
  }

  function handleDoubleClick() {
    setBurst(true);
    window.setTimeout(() => setBurst(false), 700);
    toggleLike(true);
  }

  async function sendComment(event) {
    event.preventDefault();
    const text = commentText.trim().slice(0, MAX_COMMENT);
    if (!me || !text || sending) return;
    setSending(true);
    try {
      await push(ref(db, `postComments/${post.id}`), {
        uid: me.uid,
        text,
        authorName: me.name.slice(0, 80),
        authorHandle: me.handle.slice(0, 30),
        createdAt: serverTimestamp(),
      });
      setCommentText("");
      if (post.uid !== me.uid) {
        notifyUser(
          post.uid,
          `${me.name} commented on your post: "${text.slice(0, 80)}"`,
          NOTIFY_TITLES.feed,
        );
      }
    } catch (err) {
      console.error("Comment error:", err);
      flash("Couldn't post your comment");
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(commentId) {
    try {
      await remove(ref(db, `postComments/${post.id}/${commentId}`));
    } catch (err) {
      console.error("Delete comment error:", err);
      flash("Couldn't delete the comment");
    }
  }

  async function deletePost() {
    setMenuOpen(false);
    if (!window.confirm("Delete this post?")) return;
    try {
      await update(ref(db), {
        [`posts/${post.id}`]: null,
        [`postLikes/${post.id}`]: null,
        [`postComments/${post.id}`]: null,
      });
    } catch (err) {
      console.error("Delete post error:", err);
      window.alert("Couldn't delete this post.");
    }
  }

  const longCaption = (post.caption || "").length > 140;
  const captionText =
    longCaption && !expanded ? `${post.caption.slice(0, 140)}…` : post.caption;

  return (
    <article
      className={`uf-post${highlighted ? " is-highlighted" : ""}`}
      id={`post-${post.id}`}
    >
      <header className="uf-post-head">
        <button
          type="button"
          className="gv-user-link uf-author-link"
          onClick={() => openUser(post.uid)}
          aria-label={`Open ${post.authorName || "this gamer"}'s profile`}
        >
          <Avatar name={post.authorName} photo={post.authorPhoto} />
        </button>
        <div>
          <button
            type="button"
            className="gv-user-link"
            onClick={() => openUser(post.uid)}
          >
            <strong>{post.authorName || "Gamer"}</strong>
          </button>
          <small>
            {post.authorHandle ? `@${post.authorHandle} · ` : ""}
            {timeAgo(post.createdAt)}
          </small>
        </div>
        {me && !isOwn && (
          <button
            type="button"
            className={`uf-follow${isFollowing ? " is-following" : ""}`}
            onClick={onToggleFollow}
            aria-pressed={isFollowing}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {me && (
          <div className="uf-menu">
            <button
              type="button"
              aria-label="Post options"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
                setReporting(false);
              }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="uf-menu-pop">
                {reporting ? (
                  <>
                    <span className="uf-menu-label">
                      Why are you reporting this?
                    </span>
                    {REPORT_REASONS.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className="is-neutral"
                        onClick={() => reportPost(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="is-neutral"
                      onClick={() => {
                        setMenuOpen(false);
                        sharePostLink();
                      }}
                    >
                      ↗ Share post
                    </button>
                    {!isOwn && (
                      <button type="button" onClick={() => setReporting(true)}>
                        ⚑ Report post
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={deletePost}>
                        🗑 Delete post
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="uf-media" onDoubleClick={handleDoubleClick}>
        <img
          src={post.imageData || post.imageURL}
          alt={post.caption || "Feed post"}
          loading="lazy"
        />
        {burst && (
          <span className="uf-burst" aria-hidden="true">
            ♥
          </span>
        )}
      </div>

      <div className="uf-actions">
        <button
          type="button"
          className={`uf-like${liked ? " is-liked" : ""}`}
          onClick={() => toggleLike()}
          aria-label={liked ? "Unlike" : "Like"}
          aria-pressed={liked}
        >
          {liked ? "♥" : "♡"}
        </button>
        <button
          type="button"
          aria-label="Comment"
          onClick={() => commentInputRef.current?.focus()}
        >
          💬
        </button>
        <button
          type="button"
          className="uf-share"
          aria-label="Share post"
          onClick={sharePostLink}
        >
          ↗
        </button>
        {toast && (
          <span className="uf-toast" role="status">
            {toast}
          </span>
        )}
      </div>

      <div className="uf-body">
        <strong className="uf-likes">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </strong>

        {post.game && (
          <button
            type="button"
            className="uf-game-tag"
            onClick={() => onOpenGame?.(post.game)}
          >
            🎮 {post.game}
          </button>
        )}

        {post.caption && (
          <p className="uf-caption">
            <button
              type="button"
              className="gv-user-link"
              onClick={() => openUser(post.uid)}
            >
              <strong>{authorLabel}</strong>
            </button>{" "}
            {captionText}
            {longCaption && !expanded && (
              <button type="button" onClick={() => setExpanded(true)}>
                more
              </button>
            )}
          </p>
        )}

        {comments.length > 2 && !showAll && (
          <button
            type="button"
            className="uf-view-all"
            onClick={() => setShowAll(true)}
          >
            View all {comments.length} comments
          </button>
        )}

        {visibleComments.map((comment) => (
          <p className="uf-comment" key={comment.id}>
            <button
              type="button"
              className="gv-user-link"
              onClick={() => openUser(comment.uid)}
            >
              <strong>
                {comment.authorHandle || comment.authorName || "gamer"}
              </strong>
            </button>{" "}
            {comment.text}
            {me &&
              (me.uid === comment.uid || me.uid === post.uid || me.isAdmin) && (
                <button
                  type="button"
                  aria-label="Delete comment"
                  onClick={() => deleteComment(comment.id)}
                >
                  ×
                </button>
              )}
          </p>
        ))}
      </div>

      <form className="uf-comment-form" onSubmit={sendComment}>
        <input
          ref={commentInputRef}
          value={commentText}
          maxLength={MAX_COMMENT}
          placeholder="Add a comment…"
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!me || sending}
        />
        <button type="submit" disabled={!commentText.trim() || sending}>
          Post
        </button>
      </form>
    </article>
  );
}
