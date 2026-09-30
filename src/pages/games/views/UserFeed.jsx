/* =========================================================
   USER FEED
   Instagram-style community feed for Spaces → Feed: gamers
   post a photo with a caption, others like it (heart or
   double-tap) and comment. Authors and admins can delete.

   posts/{postId}                 the post (author info copied in,
                                  since users/{uid} is private)
   postLikes/{postId}/{uid}       true
   postComments/{postId}/{id}     { uid, text, authorName, ... }

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
import { auth, db } from "../../../firebase";
import { NOTIFY_TITLES, notifyUser } from "../../../utils/notify.js";
import "../styles/user-feed.css";

const MAX_CAPTION = 2200;
const MAX_COMMENT = 500;
const FEED_SIZE = 50;
// Must stay under the imageData limit in database.rules.json.
const MAX_IMAGE_CHARS = 560000;

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

/* Phone photos are often 4–12 MB; shrink to a JPEG data URL of a
   few hundred KB, stepping size/quality down until it fits. */
async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const attempts = [
    [1080, 0.82],
    [960, 0.72],
    [800, 0.65],
    [640, 0.6],
  ];
  for (const [maxSide, quality] of attempts) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_IMAGE_CHARS) return dataUrl;
  }
  throw new Error("Image too large after compression.");
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

export default function UserFeed() {
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  /* Who's posting: author details are copied into each post. */
  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setMe(null);
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
    const stopPosts = onValue(
      query(
        ref(db, "posts"),
        orderByChild("createdAt"),
        limitToLast(FEED_SIZE),
      ),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        setPosts(list.reverse());
        setLoading(false);
      },
      (err) => {
        console.error("Feed load error:", err);
        setLoading(false);
      },
    );
    const stopLikes = onValue(ref(db, "postLikes"), (snap) =>
      setLikes(snap.val() || {}),
    );
    const stopComments = onValue(ref(db, "postComments"), (snap) => {
      const byPost = {};
      Object.entries(snap.val() || {}).forEach(([postId, items]) => {
        byPost[postId] = Object.entries(items || {})
          .map(([id, value]) => ({ id, ...value }))
          .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
      });
      setComments(byPost);
    });
    return () => {
      stopPosts();
      stopLikes();
      stopComments();
    };
  }, []);

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
      imageData = await compressImage(file);
    } catch (err) {
      console.error("Image compress error:", err);
      setError("Couldn't read this photo. Try a JPG or PNG image.");
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

      {loading ? (
        <div className="uf-empty">Loading feed…</div>
      ) : posts.length === 0 ? (
        <div className="uf-empty">
          <div>📸</div>
          <h3>No posts yet</h3>
          <p>Be the first to share a gaming moment.</p>
        </div>
      ) : (
        <div className="uf-list">
          {posts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              me={me}
              likes={likes[post.id] || {}}
              comments={comments[post.id] || []}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function FeedPost({ post, me, likes, comments }) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [burst, setBurst] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const commentInputRef = useRef(null);

  const likeCount = Object.keys(likes).length;
  const liked = Boolean(me && likes[me.uid]);
  const canDelete = Boolean(me && (me.uid === post.uid || me.isAdmin));
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
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(commentId) {
    try {
      await remove(ref(db, `postComments/${post.id}/${commentId}`));
    } catch (err) {
      console.error("Delete comment error:", err);
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
    <article className="uf-post">
      <header className="uf-post-head">
        <Avatar name={post.authorName} photo={post.authorPhoto} />
        <div>
          <strong>{post.authorName || "Gamer"}</strong>
          <small>
            {post.authorHandle ? `@${post.authorHandle} · ` : ""}
            {timeAgo(post.createdAt)}
          </small>
        </div>
        {canDelete && (
          <div className="uf-menu">
            <button
              type="button"
              aria-label="Post options"
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="uf-menu-pop">
                <button type="button" onClick={deletePost}>
                  🗑 Delete post
                </button>
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
      </div>

      <div className="uf-body">
        <strong className="uf-likes">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </strong>

        {post.caption && (
          <p className="uf-caption">
            <strong>{authorLabel}</strong> {captionText}
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
            <strong>
              {comment.authorHandle || comment.authorName || "gamer"}
            </strong>{" "}
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
