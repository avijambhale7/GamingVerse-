/* =========================================================
   UPCOMING GAMES VIEW
   Rendered by ../../Games.jsx.
========================================================= */

import { canAccessGame, getRequiredGameAge } from "../utils/access.js";

export default function UpcomingsView({
  activeView,
  filteredUpcomingGames,
  openDetails,
  upcomingGamesError,
  upcomingGamesLoading,
  userAge,
}) {
  return (
    <>
      {activeView === "upcomings" && (
        <section className="games-upcomings-page">
          <div className="games-content gv-page-enter">
            <section className="game-section upcoming-games-section">
              <div className="section-heading automatic-games-heading">
                <div>
                  <span className="section-label">UPCOMING RELEASES</span>
                  <h2>Upcoming PC & Console Games</h2>
                  <p className="catalogue-subtitle">
                    Only games with a future release date are shown here.
                  </p>
                </div>
              </div>

              {upcomingGamesLoading ? (
                <div className="automatic-games-message">
                  <span>🎮</span>
                  <div>
                    <strong>Loading upcoming games...</strong>
                    <p>Checking the latest future release dates.</p>
                  </div>
                </div>
              ) : upcomingGamesError ? (
                <div className="automatic-games-message">
                  <span>⚠️</span>
                  <div>
                    <strong>Upcoming games are unavailable.</strong>
                    <p>{upcomingGamesError}</p>
                  </div>
                </div>
              ) : filteredUpcomingGames.length > 0 ? (
                <div className="automatic-games-grid">
                  {filteredUpcomingGames.map((game) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);

                    return (
                      <article
                        className={`automatic-game-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`upcoming-${game.rawgId || game.name}`}
                        onClick={() => openDetails(game)}
                        title={
                          !accessible ? `Requires ${requiredAge}+` : game.name
                        }
                      >
                        <div className="automatic-game-image-wrap">
                          <img
                            src={game.image}
                            alt={game.name}
                            loading="lazy"
                          />
                          <div className="automatic-game-image-gradient"></div>
                          <div className="automatic-game-source-badge">
                            UPCOMING
                          </div>
                          <div className="automatic-game-age-badge">
                            {requiredAge}+
                          </div>

                          {!accessible && (
                            <div className="automatic-game-lock">
                              <span>🔒</span>
                              <strong>{requiredAge}+</strong>
                              <small>Age restricted</small>
                            </div>
                          )}
                        </div>

                        <div className="automatic-game-info">
                          <h3>{game.name}</h3>
                          <div className="automatic-game-meta">
                            <span>
                              ⭐ {game.rating ? game.rating.toFixed(1) : "New"}
                            </span>
                            <span>{game.genre}</span>
                          </div>
                          <div className="automatic-game-platforms">
                            🎮 {game.platforms}
                          </div>

                          <button
                            className="card-details-button automatic-card-view-details"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetails(game);
                            }}
                          >
                            {accessible ? "View Details" : "Age Restricted"}
                          </button>

                          <div className="automatic-game-footer">
                            <span>{game.releaseDate}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="automatic-games-message">
                  <span>📅</span>
                  <div>
                    <strong>No upcoming games found</strong>
                    <p>
                      There are no future releases matching the selected filter.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      )}
    </>
  );
}
