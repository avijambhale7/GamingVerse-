/* =========================================================
   ADMIN — COMMUNITY POST MODERATION
   Every Community Talk and club discussion in one searchable
   list, with delete and ban-author actions.
   Rendered by ../Admin.jsx (Posts tab).
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, remove } from "firebase/database";
import { db } from "../../firebase";

const SOURCES = [
  { id: "all", label: "All" },
  { id: "community", label: "💬 Community Talks" },
  { id: "club", label: "🎮 Club Discussions" },
];

function timeAgo(ts) {
  const diff = Date.now() - Number(ts || 0);
  if (!ts || diff < 0) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminPostsView({ bannedUids, onBan, onMessage }) {
  const [talks, setTalks] = useState({});
  const [discussions, setDiscussions] = useState({});
  const [clubs, setClubs] = useState({});
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");

  useEffect(() => {
    const subs = [
      onValue(ref(db, "communityTalks"), (s) => setTalks(s.val() || {}), (e) =>
        console.error("Admin talks listener error:", e),
      ),
      onValue(
        ref(db, "clubDiscussions"),
        (s) => setDiscussions(s.val() || {}),
        (e) => console.error("Admin discussions listener error:", e),
      ),
      onValue(ref(db, "clubs"), (s) => setClubs(s.val() || {}), (e) =>
        console.error("Admin clubs listener error:", e),
      ),
    ];
    return () => subs.forEach((unsubscribe) => unsubscribe());
  }, []);

  const posts = useMemo(() => {
    const list = Object.entries(talks).map(([id, post]) => ({
      ...post,
      id,
      source: "community",
      path: `communityTalks/${id}`,
      where: "Community Talks",
    }));
    Object.entries(discussions).forEach(([clubId, clubPosts]) => {
      Object.entries(clubPosts || {}).forEach(([id, post]) => {
        list.push({
          ...post,
          id,
          source: "club",
          path: `clubDiscussions/${clubId}/${id}`,
          where: clubs[clubId]?.name || "Club",
        });
      });
    });
    return list.sort(
      (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
    );
  }, [talks, discussions, clubs]);

  const visible = posts.filter((post) => {
    if (source !== "all" && post.source !== source) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${post.title} ${post.author} ${post.where}`
      .toLowerCase()
      .includes(q);
  });

  const deletePost = async (post) => {
    if (!window.confirm(`Delete this post by ${post.author || "a user"}?`))
      return;
    try {
      await remove(ref(db, post.path));
      onMessage("Post deleted.");
    } catch (error) {
      console.error("Delete post error:", error);
      onMessage("Could not delete post.");
    }
  };

  return (
    <main className="admin-main gv-page-enter">
      <section className="admin-section-head">
        <div>
          <span className="admin-kicker">MODERATION</span>
          <h2>Community Posts</h2>
          <p>Search every Community Talk and club discussion, remove posts
            that break the rules, or ban the author.</p>
        </div>
        <div className="admin-mini-stat">
          <strong>{posts.length}</strong>
          <span>Total posts</span>
        </div>
      </section>

      <section className="admin-filters-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by text, author or club..."
        />
        <div className="admin-filter-chips">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={source === item.id ? "active" : ""}
              onClick={() => setSource(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-table-card">
        {visible.length === 0 ? (
          <div className="admin-empty">
            <span>💬</span>
            <strong>
              {posts.length ? "No posts match your search" : "No posts yet"}
            </strong>
          </div>
        ) : (
          <div className="admin-user-list">
            {visible.map((post) => {
              const banned = bannedUids.has(post.authorUid);
              return (
                <article key={post.path} className="admin-review-row">
                  <div className="admin-review-info">
                    <div className="admin-review-head">
                      <strong>{post.author || "Gamer"}</strong>
                      <span className="admin-post-source">{post.where}</span>
                      {banned && (
                        <span className="admin-post-banned">Banned</span>
                      )}
                      <small>{timeAgo(post.createdAt)}</small>
                    </div>
                    <p>{post.title}</p>
                  </div>
                  <div className="admin-row-actions">
                    {post.authorUid && !banned && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Ban ${post.author || "this user"}? They will be signed out.`,
                            )
                          )
                            onBan(post.authorUid);
                        }}
                      >
                        🚫 Ban author
                      </button>
                    )}
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deletePost(post)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
