/* =========================================================
   ADMIN — REPORTED FEED POSTS
   Feed posts that users reported (postReports/{postId}/{uid}),
   most-reported first, with delete / dismiss / ban-author.
   Rendered by ../Admin.jsx at the top of the Posts tab.
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { onValue, ref, remove, update } from "firebase/database";
import { db } from "../../firebase";

const REASON_LABELS = {
  spam: "Spam",
  offensive: "Offensive",
  inappropriate: "Inappropriate image",
  other: "Other",
};

export default function AdminFeedReports({ bannedUids, onBan, onMessage }) {
  const [reports, setReports] = useState({});
  const [posts, setPosts] = useState({});

  useEffect(() => {
    const stopReports = onValue(
      ref(db, "postReports"),
      (snap) => setReports(snap.val() || {}),
      (err) => console.error("Admin reports listener error:", err),
    );
    const stopPosts = onValue(
      ref(db, "posts"),
      (snap) => setPosts(snap.val() || {}),
      (err) => console.error("Admin feed posts listener error:", err),
    );
    return () => {
      stopReports();
      stopPosts();
    };
  }, []);

  const reported = useMemo(
    () =>
      Object.entries(reports)
        .map(([postId, byUser]) => {
          const entries = Object.values(byUser || {});
          const reasons = {};
          entries.forEach((entry) => {
            reasons[entry.reason] = (reasons[entry.reason] || 0) + 1;
          });
          return {
            postId,
            post: posts[postId],
            count: entries.length,
            reasons,
            latest: Math.max(0, ...entries.map((e) => Number(e.createdAt) || 0)),
          };
        })
        .sort((a, b) => b.count - a.count || b.latest - a.latest),
    [reports, posts],
  );

  async function deletePost(postId) {
    if (!window.confirm("Delete this post for everyone?")) return;
    try {
      await update(ref(db), {
        [`posts/${postId}`]: null,
        [`postLikes/${postId}`]: null,
        [`postComments/${postId}`]: null,
        [`postReports/${postId}`]: null,
      });
      onMessage("Post deleted.");
    } catch (err) {
      console.error("Delete reported post error:", err);
      onMessage("Couldn't delete the post.");
    }
  }

  async function dismiss(postId) {
    try {
      await remove(ref(db, `postReports/${postId}`));
      onMessage("Reports dismissed — the post stays up.");
    } catch (err) {
      console.error("Dismiss reports error:", err);
      onMessage("Couldn't dismiss the reports.");
    }
  }

  return (
    <section className="admin-panel admin-feed-reports">
      <div className="admin-feed-reports-head">
        <h2>⚑ Reported Feed posts</h2>
        <span>{reported.length}</span>
      </div>

      {reported.length === 0 ? (
        <p className="admin-feed-reports-empty">
          No reported posts. When someone reports a Feed post it appears here.
        </p>
      ) : (
        <div className="admin-feed-reports-list">
          {reported.map(({ postId, post, count, reasons }) => (
            <article key={postId} className="admin-feed-report">
              {post ? (
                <img src={post.imageData || post.imageURL} alt="" />
              ) : (
                <div className="admin-feed-report-gone">Post removed</div>
              )}
              <div className="admin-feed-report-body">
                <strong>
                  {post?.authorName || "Unknown author"}
                  {post?.authorHandle ? ` · @${post.authorHandle}` : ""}
                </strong>
                {post?.caption && <p>{post.caption}</p>}
                <div className="admin-feed-report-reasons">
                  <b>
                    {count} report{count === 1 ? "" : "s"}
                  </b>
                  {Object.entries(reasons).map(([reason, n]) => (
                    <span key={reason}>
                      {REASON_LABELS[reason] || reason} ×{n}
                    </span>
                  ))}
                </div>
                <div className="admin-feed-report-actions">
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => deletePost(postId)}
                  >
                    Delete post
                  </button>
                  <button type="button" onClick={() => dismiss(postId)}>
                    Dismiss
                  </button>
                  {post?.uid && !bannedUids.has(post.uid) && (
                    <button type="button" onClick={() => onBan(post.uid)}>
                      Ban author
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
