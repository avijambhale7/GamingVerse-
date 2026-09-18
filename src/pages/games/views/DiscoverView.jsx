/* =========================================================
   DISCOVER VIEW
   Filterable game discovery grid.
   Rendered by ../../Games.jsx.
========================================================= */

import GVIcon from "../components/GVIcon.jsx";
import { canAccessGame, getRequiredGameAge } from "../utils/access.js";
import { createGameId } from "../utils/text.js";
import { getGameCategory } from "../utils/gameInfo.js";

export default function DiscoverView({
  activeView,
  discoverGames,
  discoverGenre,
  discoverHasSelection,
  discoverPlatform,
  discoverPreset,
  discoverRelease,
  discoverSort,
  gamingVerseRatings,
  openDetails,
  setDiscoverGenre,
  setDiscoverPlatform,
  setDiscoverPreset,
  setDiscoverRelease,
  setDiscoverSort,
  userAge,
}) {
  return (
    <>
      {activeView === "discover" && (
        <section className="discover-games-page">
          <div className="discover-games-layout">
            <aside className="discover-games-sidebar">
              <div className="discover-sidebar-title">FILTERS</div>

              <label className="discover-filter-label">
                <span>SORT BY</span>
                <select
                  value={discoverSort}
                  onChange={(event) => setDiscoverSort(event.target.value)}
                >
                  <option>Newest Releases</option>
                  <option>Highest Rated</option>
                  <option>Most GamingVerse Voted</option>
                </select>
              </label>

              <div className="discover-filter-group">
                <span className="discover-filter-heading">GAME TYPE</span>
                {[
                  ["All Platforms", "🎮"],
                  ["PC", "▣"],
                  ["Console", "◈"],
                ].map(([label, icon]) => (
                  <button
                    key={label}
                    type="button"
                    className={`discover-filter-button ${discoverPlatform === label ? "active" : ""}`}
                    onClick={() => {
                      setDiscoverPlatform(label);
                      setDiscoverPreset("");
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div className="discover-filter-group">
                <span className="discover-filter-heading">GENRE</span>
                {[
                  "All Genres",
                  "Action",
                  "Adventure",
                  "RPG",
                  "Racing",
                  "Sports",
                  "Shooter",
                  "Strategy",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`discover-filter-button ${discoverGenre === label ? "active" : ""}`}
                    onClick={() => {
                      setDiscoverGenre(label);
                      setDiscoverPreset("");
                    }}
                  >
                    <span className="discover-filter-dot" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="discover-filter-group">
                <span className="discover-filter-heading">RELEASE</span>
                {["All Releases", "Released", "Upcoming"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`discover-filter-button ${discoverRelease === label ? "active" : ""}`}
                    onClick={() => {
                      setDiscoverRelease(label);
                      setDiscoverPreset("");
                    }}
                  >
                    <span className="discover-filter-dot release-dot" />
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="discover-clear-button"
                onClick={() => {
                  setDiscoverSort("Newest Releases");
                  setDiscoverPlatform("All Platforms");
                  setDiscoverGenre("All Genres");
                  setDiscoverRelease("All Releases");
                  setDiscoverPreset("");
                }}
              >
                Reset filters
              </button>
            </aside>

            <main className="discover-games-main">
              <div className="discover-games-header">
                <div>
                  <span className="section-label">DISCOVER</span>
                  <h1>Find Exactly What You Want to Play</h1>
                  <p>
                    Adjust the filters to discover games tailored to your
                    platform, genre, release type and gaming style.
                  </p>
                </div>
              </div>

              <div className="discover-games-hero">
                <div className="discover-hero-icon">
                  <GVIcon name="grid" size={38} />
                </div>
                <h2>Discover Your Next Game</h2>
                <p>
                  Pick a filter or try a quick preset to build your perfect
                  gaming list.
                </p>

                <div className="discover-quick-divider" />
                <span className="discover-quick-title">
                  OR TRY A QUICK PRESET
                </span>

                <div className="discover-presets">
                  {[
                    ["Popular RPGs", "⚡"],
                    ["Top Rated Action", "✦"],
                    ["Family Friendly", "♡"],
                    ["Award Winners", "♕"],
                    ["Multiplayer", "✣"],
                    ["Open World", "✧"],
                  ].map(([label, icon]) => (
                    <button
                      key={label}
                      type="button"
                      className={`discover-preset ${discoverPreset === label ? "active" : ""}`}
                      onClick={() => {
                        setDiscoverPreset(label);
                        setDiscoverPlatform("All Platforms");
                        setDiscoverGenre("All Genres");
                        setDiscoverRelease("All Releases");
                      }}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {discoverHasSelection && (
                <section className="discover-results-section">
                  <div className="discover-results-heading">
                    <div>
                      <span className="section-label">MATCHES</span>
                      <h2>{discoverGames.length} games found</h2>
                    </div>
                    <span>GamingVerse Discover</span>
                  </div>

                  {discoverGames.length > 0 ? (
                    <div className="discover-results-grid">
                      {discoverGames.map((game) => {
                        const accessible = canAccessGame(game, userAge);
                        const requiredAge = getRequiredGameAge(game.name);
                        const meter =
                          gamingVerseRatings[createGameId(game.name)] || {};
                        return (
                          <article
                            className="discover-result-card"
                            key={`discover-${game.rawgId || game.name}`}
                            onClick={() => openDetails(game)}
                          >
                            <div className="discover-result-image">
                              {game.image ? (
                                <img
                                  src={game.image}
                                  alt={game.name}
                                  loading="lazy"
                                />
                              ) : (
                                <span>🎮</span>
                              )}
                              <span className="discover-result-age">
                                {requiredAge}+
                              </span>
                            </div>
                            <div className="discover-result-info">
                              <h3>{game.name}</h3>
                              <p>{game.genre || getGameCategory(game)}</p>
                              <div className="discover-result-meta">
                                <span>{game.platforms || "PC • Console"}</span>
                                {meter.total > 0 && (
                                  <strong>{meter.percent}% GV</strong>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDetails(game);
                                }}
                              >
                                {accessible ? "View Details" : "View Access"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="discover-no-results">
                      <span>🎮</span>
                      <h2>No games match these filters</h2>
                      <p>Try another genre, platform or quick preset.</p>
                    </div>
                  )}
                </section>
              )}
            </main>
          </div>
        </section>
      )}
    </>
  );
}
