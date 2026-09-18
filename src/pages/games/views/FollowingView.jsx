/* =========================================================
   FOLLOWING ACTIVITY VIEW
   Rendered by ../../Games.jsx.
========================================================= */

import { formatActivityDate } from "../utils/text.js";

export default function FollowingView({
  activeView,
  activityFilter,
  activityReviews,
  activitySort,
  setActivityFilter,
  setActivitySort,
}) {
  return (
    <>
      {activeView === "following" && (
        <section className="following-activity-page">
          <div className="following-activity-layout">
            <aside className="following-activity-sidebar">
              <div className="activity-sidebar-title">FILTER BY</div>
              {[
                ["All", "#a83fff"],
                ["Perfection", "#a83fff"],
                ["Go For It", "#00d084"],
                ["Timepass", "#ffb400"],
                ["Skip", "#ff5c7a"],
              ].map(([label, dot]) => (
                <button
                  key={label}
                  type="button"
                  className={`activity-filter-option ${activityFilter === label ? "active" : ""}`}
                  onClick={() => setActivityFilter(label)}
                >
                  <span
                    className="activity-filter-dot"
                    style={{ background: dot }}
                  />
                  <span>{label}</span>
                </button>
              ))}

              <div className="activity-sidebar-divider" />
              <div className="activity-sidebar-title">SORT BY</div>
              {["Recent", "Oldest"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`activity-sort-option ${activitySort === label ? "active" : ""}`}
                  onClick={() => setActivitySort(label)}
                >
                  <span className="activity-radio" />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            <main className="following-activity-main">
              <div className="following-activity-heading">
                <h1>Activity</h1>
                <p>See what your friends are reviewing</p>
              </div>

              {(() => {
                const verdictMap = {
                  All: null,
                  Perfection: "perfection",
                  "Go For It": "go-for-it",
                  Timepass: "timepass",
                  Skip: "skip",
                };
                const wantedVerdict = verdictMap[activityFilter];
                let visible = activityReviews.filter(
                  (review) =>
                    !wantedVerdict || review.verdict === wantedVerdict,
                );

                visible = [...visible].sort((a, b) =>
                  activitySort === "Oldest"
                    ? (a.createdAt || 0) - (b.createdAt || 0)
                    : (b.createdAt || 0) - (a.createdAt || 0),
                );

                const groups = {};
                visible.forEach((review) => {
                  const date = new Date(review.createdAt || Date.now());
                  const now = new Date();
                  const days = Math.floor((now - date) / 86400000);
                  const label =
                    days < 7
                      ? "Last Week"
                      : date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        });
                  if (!groups[label]) groups[label] = [];
                  groups[label].push(review);
                });

                const groupEntries = Object.entries(groups);

                return groupEntries.length ? (
                  <div className="following-activity-timeline">
                    {groupEntries.map(([period, items]) => (
                      <section className="activity-period" key={period}>
                        <h2>{period}</h2>
                        {items.map((review) => {
                          const verdictLabel =
                            {
                              perfection: "Perfection",
                              "go-for-it": "Go For It",
                              timepass: "Timepass",
                              skip: "Skip",
                            }[review.verdict] || "Perfection";
                          const when = review.createdAt
                            ? formatActivityDate(review.createdAt)
                            : "Recently";
                          return (
                            <article
                              className="activity-review-card"
                              key={`${review.gameId}-${review.id}`}
                            >
                              <div className="activity-timeline-line" />
                              <div className="activity-review-poster">
                                {review.gameImage ? (
                                  <img src={review.gameImage} alt="" />
                                ) : (
                                  <div className="activity-poster-fallback">
                                    🎮
                                  </div>
                                )}
                              </div>
                              <div className="activity-review-copy">
                                <div className="activity-review-user">
                                  <span className="activity-user-avatar">
                                    {review.initials ||
                                      String(review.userName || "G")
                                        .charAt(0)
                                        .toUpperCase()}
                                  </span>
                                  <strong>{review.userName || "Gamer"}</strong>
                                  <span>reviewed</span>
                                </div>
                                <h3>
                                  {String(
                                    review.gameName || review.gameId || "Game",
                                  ).replace(/[-_]+/g, " ")}
                                </h3>
                                <span className="activity-review-date">
                                  {when}
                                </span>
                              </div>
                              <span
                                className={`activity-verdict-badge ${review.verdict || "perfection"}`}
                              >
                                {verdictLabel}
                              </span>
                            </article>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="following-activity-empty">
                    <span>◌</span>
                    <h2>No recent activity</h2>
                    <p>Reviews from people you follow will appear here.</p>
                  </div>
                );
              })()}
            </main>
          </div>
        </section>
      )}
    </>
  );
}
