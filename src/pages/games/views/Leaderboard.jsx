/* =========================================================
   LEADERBOARD
   Top 10 lists that reward taking part:
   - Top reviewers: likes received on game reviews
   - Top creators: likes received on Feed posts
   - Biggest clubs: members
   Read once when opened (refresh button reloads). Your own
   row is highlighted. Rendered by ./SpacesView.jsx.
========================================================= */

import { useCallback, useEffect, useMemo, useState } from "react";
import { get, ref } from "firebase/database";
import { auth, db } from "../../../firebase";
import "../styles/leaderboard.css";

const BOARDS = [
  { id: "reviewers", label: "Top reviewers", icon: "✍️", unit: "review likes" },
  { id: "creators", label: "Top creators", icon: "📸", unit: "post likes" },
  { id: "clubs", label: "Biggest clubs", icon: "♣", unit: "members" },
];

const initials = (name) =>
  String(name || "G")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "G";

const readNode = (path) =>
  get(ref(db, path))
    .then((snap) => snap.val() || {})
    .catch(() => ({}));

const fetchBoards = () =>
  Promise.all([
    readNode("gameReviews"),
    readNode("posts"),
    readNode("postLikes"),
    readNode("clubs"),
  ]).then(([reviews, posts, postLikes, clubs]) => ({
    reviews,
    posts,
    postLikes,
    clubs,
  }));

export default function Leaderboard() {
  const [board, setBoard] = useState("reviewers");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const myUid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    setLoading(true);
    setData(await fetchBoards());
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetchBoards().then((boards) => {
      if (!active) return;
      setData(boards);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];

    if (board === "reviewers") {
      const tally = {};
      Object.values(data.reviews).forEach((byUser) => {
        Object.entries(byUser || {}).forEach(([uid, review]) => {
          if (!review?.review) return;
          const entry = (tally[uid] ||= { id: uid, name: review.userName || "Gamer", score: 0, sub: 0 });
          entry.score += Object.keys(review.likes || {}).length;
          entry.sub += 1;
        });
      });
      return Object.values(tally)
        .map((e) => ({ ...e, detail: `${e.sub} review${e.sub === 1 ? "" : "s"}` }))
        .filter((e) => e.sub > 0);
    }

    if (board === "creators") {
      const tally = {};
      Object.entries(data.posts).forEach(([postId, post]) => {
        if (!post?.uid) return;
        const entry = (tally[post.uid] ||= {
          id: post.uid,
          name: post.authorName || "Gamer",
          handle: post.authorHandle || "",
          score: 0,
          sub: 0,
        });
        entry.score += Object.keys(data.postLikes[postId] || {}).length;
        entry.sub += 1;
      });
      return Object.values(tally).map((e) => ({
        ...e,
        detail: `${e.sub} post${e.sub === 1 ? "" : "s"}`,
      }));
    }

    return Object.entries(data.clubs).map(([id, club]) => ({
      id,
      name: club?.name || "Club",
      score: Number(club?.memberCount) || 0,
      detail: club?.interest || "Gaming club",
      isClub: true,
    }));
  }, [data, board]);

  const ranked = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.score - a.score || (b.sub || 0) - (a.sub || 0))
        .map((row, index) => ({ ...row, rank: index + 1 })),
    [rows],
  );
  const top = ranked.slice(0, 10);
  const mine = ranked.find((row) => !row.isClub && row.id === myUid);
  const active = BOARDS.find((b) => b.id === board);

  return (
    <main className="trailers-feed leaderboard">
      <div className="lb-head">
        <div>
          <span className="section-label">COMMUNITY</span>
          <h1>Leaderboard</h1>
          <p>The most helpful reviewers, top creators and biggest clubs.</p>
        </div>
        <button type="button" className="lb-refresh" onClick={load} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      <div className="lb-tabs" role="tablist" aria-label="Leaderboards">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={board === b.id}
            className={board === b.id ? "is-active" : ""}
            onClick={() => setBoard(b.id)}
          >
            <span aria-hidden="true">{b.icon}</span> {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lb-empty">Loading rankings…</div>
      ) : top.length === 0 ? (
        <div className="lb-empty">
          Nobody is on this board yet — be the first!
        </div>
      ) : (
        <ol className="lb-list">
          {top.map((row) => (
            <li
              key={row.id}
              className={`lb-row${row.rank <= 3 ? ` is-top is-rank-${row.rank}` : ""}${
                !row.isClub && row.id === myUid ? " is-me" : ""
              }`}
            >
              <span className="lb-rank">
                {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
              </span>
              <span className="lb-avatar" aria-hidden="true">
                {row.isClub ? "♣" : initials(row.name)}
              </span>
              <span className="lb-name">
                <strong>
                  {row.name}
                  {!row.isClub && row.id === myUid && <em> (you)</em>}
                </strong>
                <small>
                  {row.handle ? `@${row.handle} · ` : ""}
                  {row.detail}
                </small>
              </span>
              <span className="lb-score">
                <strong>{row.score}</strong>
                <small>{active.unit}</small>
              </span>
            </li>
          ))}
        </ol>
      )}

      {!loading && mine && mine.rank > 10 && (
        <p className="lb-mine">
          You're <strong>#{mine.rank}</strong> with {mine.score} {active.unit}. Keep going!
        </p>
      )}
    </main>
  );
}
