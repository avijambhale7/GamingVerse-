/* =========================================================
   ADMIN — FEED MODERATION
   Every Feed post (not just reported ones): search, filter,
   see likes / comments / reports, read and delete comments,
   delete the post, ban the author, open it in the Feed or
   open the author's profile.
   Rendered by ../Admin.jsx (Feed tab), under AdminFeedReports.
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onValue, ref, remove, update } from "firebase/database";
import { db } from "../../firebase";
import timeAgo from "../../utils/timeAgo.js";
import { userPath } from "../../utils/publicProfile.js";
import "./AdminFeed.css";

const DAY = 24 * 60 * 60 * 1000;
const FILTERS = [
  { id: "all", label: "All posts" },
  { id: "reported", label: "⚑ Reported" },
  { id: "today", label: "Last 24h" },
  { id: "banned", label: "From banned users" },
];
const PAGE = 24;

export default function AdminFeedView({ bannedUids, onBan, onMessage }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState({});
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [reports, setReports] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [openComments, setOpenComments] = useState(null);
  const [shown, setShown] = useState(PAGE);
  // Rendered once per mount, so "last 24h" doesn't shift mid-session.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const listen = (path, setter) =>
      onValue(
        ref(db, path),
        (snap) => setter(snap.val() || {}),
        (err) => console.error(`Admin ${path} listener error:`, err),
      );
    const stops = [
      listen("posts", setPosts),
      listen("postLikes", setLikes),
      listen("postComments", setComments),
      listen("postReports", setReports),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const all = useMemo(
    () =>
      Object.entries(posts)
        .map(([id, post]) => ({
          id,
          ...post,
          likeCount: Object.keys(likes[id] || {}).length,
          commentList: Object.entries(comments[id] || {})
            .map(([cid, c]) => ({ id: cid, ...c }))
            .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)),
          reportCount: Object.keys(reports[id] || {}).length,
        }))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [posts, likes, comments, reports],
  );

  const stats = useMemo(
    () => ({
      total: all.length,
      today: all.filter((p) => now - Number(p.createdAt || 0) < DAY).length,
      comments: all.reduce((n, p) => n + p.commentList.length, 0),
      reported: all.filter((p) => p.reportCount > 0).length,
    }),
    [all, now],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((p) => {
      if (filter === "reported" && !p.reportCount) return false;
      if (filter === "today" && now - Number(p.createdAt || 0) >= DAY) return false;
      if (filter === "banned" && !bannedUids.has(p.uid)) return false;
      if (!q) return true;
      return [p.authorName, p.authorHandle, p.caption, p.game]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(q));
    });
  }, [all, filter, search, bannedUids, now]);

  async function deletePost(post) {
    if (!window.confirm(`Delete this post by ${post.authorName || "this user"} for everyone?`)) {
      return;
    }
    try {
      await update(ref(db), {
        [`posts/${post.id}`]: null,
        [`postLikes/${post.id}`]: null,
        [`postComments/${post.id}`]: null,
        [`postReports/${post.id}`]: null,
      });
      if (openComments === post.id) setOpenComments(null);
      onMessage("Post deleted.");
    } catch (err) {
      console.error("Admin delete post error:", err);
      onMessage("Couldn't delete the post.");
    }
  }

  async function deleteComment(postId, comment) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await remove(ref(db, `postComments/${postId}/${comment.id}`));
      onMessage("Comment deleted.");
    } catch (err) {
      console.error("Admin delete comment error:", err);
      onMessage("Couldn't delete the comment.");
    }
  }

  return (
    <main className="admin-main gv-page-enter admin-feed">
      <section className="admin-section-head">
        <div>
          <span className="admin-kicker">MODERATION</span>
          <h2>Community Feed</h2>
          <p>Every photo post, with its likes, comments and reports.</p>
        </div>
      </section>

      <section className="afv-stats">
        <div>
          <strong>{stats.total}</strong>
          <span>Posts</span>
        </div>
        <div>
          <strong>{stats.today}</strong>
          <span>Last 24h</span>
        </div>
        <div>
          <strong>{stats.comments}</strong>
          <span>Comments</span>
        </div>
        <div className={stats.reported ? "is-alert" : ""}>
          <strong>{stats.reported}</strong>
          <span>Reported</span>
        </div>
      </section>

      <section className="afv-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Search author, caption or game…"
          onChange={(e) => {
            setSearch(e.target.value);
            setShown(PAGE);
          }}
        />
        <div className="afv-filters" role="tablist" aria-label="Filter posts">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={filter === f.id ? "is-active" : ""}
              onClick={() => {
                setFilter(f.id);
                setShown(PAGE);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {visible.length === 0 ? (
        <div className="admin-empty">
          <span>📸</span>
          <strong>{all.length ? "No posts match" : "No Feed posts yet"}</strong>
        </div>
      ) : (
        <section className="afv-grid">
          {visible.slice(0, shown).map((post) => {
            const banned = bannedUids.has(post.uid);
            const showingComments = openComments === post.id;
            return (
              <article
                key={post.id}
                className={`afv-card${post.reportCount ? " is-reported" : ""}`}
              >
                <div className="afv-media">
                  <img src={post.imageData || post.imageURL} alt="" loading="lazy" />
                  {post.reportCount > 0 && (
                    <span className="afv-flag">
                      ⚑ {post.reportCount} report{post.reportCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                <div className="afv-body">
                  <button
                    type="button"
                    className="afv-author"
                    onClick={() => post.uid && navigate(userPath(post.uid))}
                    title="Open profile"
                  >
                    <strong>{post.authorName || "Unknown"}</strong>
                    <small>
                      {post.authorHandle ? `@${post.authorHandle} · ` : ""}
                      {timeAgo(post.createdAt)}
                    </small>
                  </button>
                  {banned && <span className="afv-banned">Banned</span>}

                  {post.game && <span className="afv-game">🎮 {post.game}</span>}
                  {post.caption && <p className="afv-caption">{post.caption}</p>}

                  <div className="afv-counts">
                    <span>♥ {post.likeCount}</span>
                    <button
                      type="button"
                      onClick={() => setOpenComments(showingComments ? null : post.id)}
                      aria-expanded={showingComments}
                    >
                      💬 {post.commentList.length}{" "}
                      {showingComments ? "▴" : "▾"}
                    </button>
                  </div>

                  {showingComments && (
                    <ul className="afv-comments">
                      {post.commentList.length === 0 ? (
                        <li className="afv-comments-empty">No comments.</li>
                      ) : (
                        post.commentList.map((c) => (
                          <li key={c.id}>
                            <div>
                              <strong>{c.authorHandle || c.authorName || "gamer"}</strong>{" "}
                              {c.text}
                              <small>{timeAgo(c.createdAt)}</small>
                            </div>
                            <button
                              type="button"
                              aria-label="Delete comment"
                              onClick={() => deleteComment(post.id, c)}
                            >
                              🗑
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}

                  <div className="afv-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/games?view=spaces&post=${post.id}`)}
                    >
                      View in Feed
                    </button>
                    {post.uid && !banned && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Ban ${post.authorName || "this user"}?`)) {
                            onBan(post.uid);
                          }
                        }}
                      >
                        Ban author
                      </button>
                    )}
                    <button type="button" className="is-danger" onClick={() => deletePost(post)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {visible.length > shown && (
        <button
          type="button"
          className="afv-more"
          onClick={() => setShown((n) => n + PAGE)}
        >
          Show more ({visible.length - shown} left)
        </button>
      )}
    </main>
  );
}
