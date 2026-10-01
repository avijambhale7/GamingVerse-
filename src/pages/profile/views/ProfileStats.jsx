/* =========================================================
   PROFILE STATS & BADGES
   A gamer's numbers at a glance: activity tiles, verdict
   breakdown, favourite genres and achievement badges.
   Café visits and posts are read live; the rest comes from
   props ProfileView already has. Rendered by ./ProfileView.jsx.
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import { db } from "../../../firebase";
import { getGameGenreLabel } from "../../games/utils/gameInfo.js";
import "../styles/stats.css";

const VERDICTS = [
  { id: "perfection", label: "Perfection", tone: "perfection" },
  { id: "go-for-it", label: "Go for it", tone: "go" },
  { id: "timepass", label: "Timepass", tone: "timepass" },
  { id: "skip", label: "Skip", tone: "skip" },
];

export default function ProfileStats({
  uid,
  reviews,
  collectionGames,
  playedGames,
  followersCount,
}) {
  const [cafeVisits, setCafeVisits] = useState(0);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!uid) return undefined;
    const stopBookings = onValue(
      ref(db, `cafeBookings/${uid}`),
      (snap) => {
        const bookings = Object.values(snap.val() || {});
        setCafeVisits(
          bookings.filter((b) => !b.walkIn && b.status === "Completed").length,
        );
      },
      (err) => console.warn("Stats bookings error:", err),
    );
    const stopPosts = onValue(
      query(ref(db, "posts"), orderByChild("uid"), equalTo(uid)),
      (snap) => setPostCount(snap.size),
      (err) => console.warn("Stats posts error:", err),
    );
    return () => {
      stopBookings();
      stopPosts();
    };
  }, [uid]);

  const verdictCounts = useMemo(() => {
    const counts = Object.fromEntries(VERDICTS.map((v) => [v.id, 0]));
    reviews.forEach((review) => {
      if (counts[review.verdict] !== undefined) counts[review.verdict] += 1;
    });
    return counts;
  }, [reviews]);
  const maxVerdict = Math.max(1, ...Object.values(verdictCounts));

  // Genres across everything the gamer reviewed, collected or played.
  const topGenres = useMemo(() => {
    const tally = {};
    const names = new Set([
      ...reviews.map((r) => r.rawGameName || r.gameName),
      ...collectionGames,
      ...playedGames,
    ]);
    names.forEach((name) => {
      const genre = getGameGenreLabel({ name });
      if (genre) tally[genre] = (tally[genre] || 0) + 1;
    });
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [reviews, collectionGames, playedGames]);

  const tiles = [
    { label: "Reviews", value: reviews.length, icon: "✎" },
    { label: "Played", value: playedGames.length, icon: "👁" },
    { label: "Café visits", value: cafeVisits, icon: "☕" },
    { label: "Posts", value: postCount, icon: "📸" },
  ];

  const badges = [
    { icon: "✍️", name: "First Verdict", goal: "Review 1 game", earned: reviews.length >= 1 },
    { icon: "🎯", name: "Critic", goal: "Review 10 games", earned: reviews.length >= 10 },
    { icon: "📚", name: "Collector", goal: "10 games in Collections", earned: collectionGames.length >= 10 },
    { icon: "🕹️", name: "Explorer", goal: "Mark 10 games as played", earned: playedGames.length >= 10 },
    { icon: "☕", name: "Café Regular", goal: "Complete 3 café sessions", earned: cafeVisits >= 3 },
    { icon: "📸", name: "Creator", goal: "Share a post in the Feed", earned: postCount >= 1 },
    { icon: "⭐", name: "Rising Star", goal: "Reach 10 followers", earned: followersCount >= 10 },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section className="profile-stats" aria-label="Your gaming stats">
      <div className="ps-tiles">
        {tiles.map((tile) => (
          <div className="ps-tile" key={tile.label}>
            <span aria-hidden="true">{tile.icon}</span>
            <strong>{tile.value}</strong>
            <small>{tile.label}</small>
          </div>
        ))}
      </div>

      <div className="ps-grid">
        <div className="ps-card">
          <h3>Your verdicts</h3>
          {reviews.length === 0 ? (
            <p className="ps-empty">Give a game a verdict to see your breakdown.</p>
          ) : (
            <ul className="ps-bars">
              {VERDICTS.map((v) => (
                <li key={v.id} title={`${v.label}: ${verdictCounts[v.id]}`}>
                  <span className="ps-bar-label">{v.label}</span>
                  <span className="ps-bar-track">
                    <span
                      className={`ps-bar-fill is-${v.tone}`}
                      style={{ width: `${(verdictCounts[v.id] / maxVerdict) * 100}%` }}
                    />
                  </span>
                  <span className="ps-bar-value">{verdictCounts[v.id]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ps-card">
          <h3>Favourite genres</h3>
          {topGenres.length === 0 ? (
            <p className="ps-empty">Review, collect or play games to find your genres.</p>
          ) : (
            <ol className="ps-genres">
              {topGenres.map(([genre, count], i) => (
                <li key={genre}>
                  <span className="ps-rank">{i + 1}</span>
                  <strong>{genre}</strong>
                  <small>
                    {count} game{count === 1 ? "" : "s"}
                  </small>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="ps-card">
        <h3>
          Badges <small>{earnedCount} of {badges.length} earned</small>
        </h3>
        <div className="ps-badges">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`ps-badge${badge.earned ? " is-earned" : ""}`}
              title={badge.earned ? `${badge.name} — earned` : `${badge.name} — ${badge.goal}`}
            >
              <span aria-hidden="true">{badge.icon}</span>
              <strong>{badge.name}</strong>
              <small>{badge.earned ? "Earned" : badge.goal}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
