/* =========================================================
   TOP 100 GAMES VIEW
   Rendered by ../../Games.jsx.
========================================================= */

import { createGameId } from "../utils/text.js";

export default function Top100View({
  activeView,
  gamingVerseRatings,
  openDetails,
  setTop100Filter,
  setTop100Sort,
  top100Filter,
  top100FormatVotes,
  top100Games,
  top100Sort,
  top100Year,
}) {
  return (
    <>
      {activeView === "top100" && (
        <section className="top100-games-page">
          <div className="top100-games-layout">
            <aside className="top100-games-sidebar">
              <div className="top100-sidebar-title">FILTER BY</div>
              {[
                ["All", "#a83fff"],
                ["Perfection", "#a83fff"],
                ["Go For It", "#00d084"],
                ["Timepass", "#ffb400"],
                ["Skip", "#ff5c7a"],
              ].map(([label, dot]) => (
                <button
                  key={`top100-filter-${label}`}
                  type="button"
                  className={`top100-filter-option ${top100Filter === label ? "active" : ""}`}
                  onClick={() => setTop100Filter(label)}
                >
                  <span
                    className="top100-filter-dot"
                    style={{ background: dot }}
                  />
                  <span>{label}</span>
                </button>
              ))}

              <div className="top100-sidebar-divider" />
              <div className="top100-sidebar-title">SORT BY</div>
              {["Game", "PC", "Console"].map((label) => (
                <button
                  key={`top100-sort-${label}`}
                  type="button"
                  className={`top100-sort-option ${top100Sort === label ? "active" : ""}`}
                  onClick={() => setTop100Sort(label)}
                >
                  <span className="top100-radio" />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            <main className="top100-games-main">
              <div className="top100-games-heading">
                <h1>Top 100 Games</h1>
                <span>{top100Games.length} games • GamingVerse Meter</span>
              </div>

              <div className="top100-games-list">
                {top100Games.map((game, index) => {
                  const meter =
                    gamingVerseRatings[createGameId(game?.name || "")] || {};
                  const percent = Number.isFinite(Number(meter.percent))
                    ? Number(meter.percent)
                    : 0;
                  const votes = Number(meter.total) || 0;
                  const circumference = 282.74;
                  const dashOffset =
                    circumference - (circumference * percent) / 100;

                  return (
                    <article
                      className="top100-game-row"
                      key={`top100-${game.name}-${index}`}
                    >
                      <div className={`top100-rank rank-${index + 1}`}>
                        {index + 1}
                      </div>

                      <button
                        type="button"
                        className="top100-game-poster"
                        onClick={() => openDetails(game)}
                        aria-label={`Open ${game.name}`}
                      >
                        {game.image ? (
                          <img src={game.image} alt={game.name} />
                        ) : (
                          <span>🎮</span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="top100-game-info"
                        onClick={() => openDetails(game)}
                      >
                        <h2>{game.name}</h2>
                        <p>Game • {top100Year(game.releaseDate)}</p>
                      </button>

                      <div className="top100-score">
                        <svg
                          viewBox="0 0 200 105"
                          aria-label={`${percent}% GamingVerse Meter rating`}
                        >
                          <path
                            className="top100-score-track"
                            d="M10 95 A90 90 0 0 1 190 95"
                          />
                          <path
                            className="top100-score-progress"
                            d="M10 95 A90 90 0 0 1 190 95"
                            style={{
                              strokeDasharray: circumference,
                              strokeDashoffset: dashOffset,
                            }}
                          />
                        </svg>
                        <strong>{percent}%</strong>
                        <span>
                          {votes
                            ? `${top100FormatVotes(votes)} GamingVerse Votes`
                            : "No GamingVerse votes yet"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {top100Games.length === 0 && (
                <div className="top100-games-empty">
                  <span>🎮</span>
                  <h2>No games match this filter</h2>
                  <p>
                    Only games with GamingVerse community votes appear in this
                    filter.
                  </p>
                </div>
              )}
            </main>
          </div>
        </section>
      )}
    </>
  );
}
