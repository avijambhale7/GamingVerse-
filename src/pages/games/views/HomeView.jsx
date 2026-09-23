/* =========================================================
   HOME VIEW
   Hero carousel, featured games, posters and the live catalogue.
   Rendered by ../../Games.jsx.
========================================================= */

import { canAccessGame, getRequiredGameAge, isBlockedGame } from "../utils/access.js";
import { containsBlockedGameTerm } from "../utils/text.js";
import { gameAgeRatings } from "../data/ageRatings.js";
import { getGameDetails } from "../utils/gameInfo.js";

export default function HomeView({
  activeCategory,
  activeView,
  automaticGamesError,
  filteredAutomaticGames,
  filteredHorizontal,
  filteredPosters,
  heroGames,
  heroIndex,
  openDetails,
  setActiveCategory,
  setHeroIndex,
  setSearch,
  setShowAllAutomaticGames,
  setShowAllCatalogueGames,
  setShowAllFeaturedGames,
  showAllAutomaticGames,
  showAllCatalogueGames,
  showAllFeaturedGames,
  userAge,
  visibleAutomaticGames,
}) {
  return (
    <>
      {activeView === "home" && (
        <>
          {/* ===================================================
            HERO
        =================================================== */}

          {heroGames.length > 0 && (
            <section className="hero-section">
              <div className="hero-image-wrapper">
                <div className="hero-media">
                  <img
                    key={heroGames[heroIndex % heroGames.length].image}
                    src={heroGames[heroIndex % heroGames.length].image}
                    alt={heroGames[heroIndex % heroGames.length].name}
                    className="hero-image"
                  />
                  <div className="hero-overlay"></div>
                </div>

                <div className="hero-content">
                  <div className="hero-badge">🔥 FEATURED GAME</div>

                  <h1>{heroGames[heroIndex % heroGames.length].name}</h1>

                  <p>
                    {getGameDetails(
                      heroGames[heroIndex % heroGames.length].name,
                    ).description ||
                      "Explore amazing worlds, unforgettable adventures and legendary gaming experiences."}
                  </p>

                  <div className="hero-buttons">
                    <button
                      className="play-button"
                      type="button"
                      onClick={() =>
                        openDetails(heroGames[heroIndex % heroGames.length])
                      }
                    >
                      ▶ View Game
                    </button>
                  </div>
                </div>

                <div className="hero-carousel">
                  <div className="hero-thumbnails">
                    {heroGames.map((game, index) => (
                      <button
                        key={`hero-thumb-${game.name}`}
                        type="button"
                        className={`hero-thumb ${index === heroIndex ? "active" : ""}`}
                        onClick={() => setHeroIndex(index)}
                        aria-label={`Show ${game.name}`}
                      >
                        <img src={game.image} alt="" />
                        <span>{game.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="hero-carousel-arrows">
                    <button
                      type="button"
                      onClick={() =>
                        setHeroIndex(
                          (heroIndex - 1 + heroGames.length) % heroGames.length,
                        )
                      }
                      aria-label="Previous featured game"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setHeroIndex((heroIndex + 1) % heroGames.length)
                      }
                      aria-label="Next featured game"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ===================================================
            FEATURED GAMES
        =================================================== */}

          <main className="games-content gv-page-enter">
            <section className="game-section">
              <div className="section-heading featured-games-heading">
                <div>
                  <span className="section-label">DISCOVER</span>
                  <h2>Featured Games</h2>
                </div>

                <div className="featured-games-actions">
                  <label className="home-category-select">
                    <span>Category</span>
                    <select
                      value={activeCategory}
                      onChange={(event) =>
                        setActiveCategory(event.target.value)
                      }
                      aria-label="Featured games category"
                    >
                      <option value="All">All Categories</option>
                      <option value="Action">Action</option>
                      <option value="Adventure">Adventure</option>
                      <option value="RPG">RPG</option>
                      <option value="Racing">Racing</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </label>

                  <button
                    className="view-all"
                    type="button"
                    onClick={() => setShowAllFeaturedGames((prev) => !prev)}
                  >
                    {showAllFeaturedGames ? "Show Less ↑" : "View All →"}
                  </button>
                </div>
              </div>

              <div className="horizontal-grid">
                {filteredHorizontal
                  .filter((game) => !containsBlockedGameTerm(game.name))
                  .slice(
                    0,
                    showAllFeaturedGames ? filteredHorizontal.length : 3,
                  )
                  .map((game, index) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);
                    const blocked = isBlockedGame(game);

                    return (
                      <div
                        className={`horizontal-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`${game.name}-${index}`}
                        onClick={() => openDetails(game)}
                        title={
                          !accessible
                            ? blocked
                              ? "Unavailable: blocked by GamingVerse safety system"
                              : `Requires ${requiredAge}+`
                            : game.name
                        }
                      >
                        <img src={game.image} alt={game.name} />

                        <div className="card-gradient"></div>

                        {!accessible && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 4,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              background: "rgba(0,0,0,0.56)",
                              backdropFilter: "blur(2px)",
                              textAlign: "center",
                              pointerEvents: "none",
                            }}
                          >
                            <span style={{ fontSize: "30px" }}>🔒</span>
                            <strong style={{ fontSize: "15px" }}>
                              {blocked ? "Unavailable" : `${requiredAge}+`}
                            </strong>
                            <small style={{ color: "rgba(255,255,255,0.72)" }}>
                              {blocked ? "Safety restricted" : "Age restricted"}
                            </small>
                          </div>
                        )}

                        <div className="horizontal-info">
                          <h3>{game.name}</h3>

                          <div className="game-meta">
                            <span>🎮 Action</span>
                            <span>{gameAgeRatings[game.name] || "16+"}</span>
                          </div>

                          <button
                            className="card-details-button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(game);
                            }}
                          >
                            {accessible ? "View Details" : "Age Restricted"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* =================================================
            AUTOMATIC GAME CATALOGUE
            ================================================= */}
            <section className="game-section automatic-games-section">
              <div className="section-heading automatic-games-heading">
                <div>
                  <span className="section-label">LIVE CATALOGUE</span>
                  <h2>Latest PC & Console Games</h2>
                </div>

                <button
                  className="view-all automatic-view-all"
                  type="button"
                  onClick={() => {
                    const nextShowAll = !showAllAutomaticGames;
                    setShowAllAutomaticGames(nextShowAll);
                    if (nextShowAll) {
                      setSearch("");
                      setActiveCategory("All");
                    }
                    requestAnimationFrame(() => {
                      document
                        .querySelector(".automatic-games-section")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    });
                  }}
                >
                  {showAllAutomaticGames ? "Show Less ↑" : "View All →"}
                </button>
              </div>

              {automaticGamesError ? (
                <div className="automatic-games-message">
                  <span>⚠️</span>
                  <div>
                    <strong>Automatic games are not connected yet.</strong>
                    <p>{automaticGamesError}</p>
                  </div>
                </div>
              ) : filteredAutomaticGames.length > 0 ? (
                <div className="automatic-games-grid">
                  {visibleAutomaticGames.map((game) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);

                    return (
                      <article
                        className={`automatic-game-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`automatic-${game.rawgId || game.name}`}
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
                            AUTO
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
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="automatic-games-message">
                  <span>🎮</span>
                  <div>
                    <strong>No automatic games found</strong>
                    <p>
                      Try clearing the search or refresh the GamingVerse
                      catalogue.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
            COLLECTIONS
            ================================================= */}

            {/* =================================================
            ALL GAMES
        ================================================= */}

            <section className="game-section">
              <div className="section-heading">
                <div>
                  <span className="section-label">COLLECTION</span>
                  <h2>All Games</h2>
                </div>

                <button
                  className="view-all"
                  type="button"
                  onClick={() => setShowAllCatalogueGames((prev) => !prev)}
                >
                  {showAllCatalogueGames ? "Show Less ↑" : "View All →"}
                </button>
              </div>

              <div className="poster-grid">
                {filteredPosters
                  .filter((game) => !containsBlockedGameTerm(game.name))
                  .slice(0, showAllCatalogueGames ? filteredPosters.length : 6)
                  .map((game, index) => {
                    const requiredAge = getRequiredGameAge(game.name);
                    const accessible = canAccessGame(game, userAge);
                    const blocked = isBlockedGame(game);

                    return (
                      <div
                        className={`poster-card ${
                          !accessible ? "age-restricted-card" : ""
                        }`}
                        key={`${game.name}-${index}`}
                      >
                        <div
                          className="poster-image-wrapper"
                          onClick={() => openDetails(game)}
                          title={
                            !accessible
                              ? blocked
                                ? "Unavailable: blocked by GamingVerse safety system"
                                : `Requires ${requiredAge}+`
                              : game.name
                          }
                        >
                          {game.image ? (
                            <img src={game.image} alt={game.name} />
                          ) : (
                            <div className="database-game-fallback">
                              <span>🎮</span>
                              <strong>{game.name}</strong>
                            </div>
                          )}

                          {!accessible && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                background: "rgba(0,0,0,0.52)",
                                textAlign: "center",
                                borderRadius: "inherit",
                                pointerEvents: "none",
                              }}
                            >
                              <span style={{ fontSize: "25px" }}>🔒</span>
                              <strong style={{ fontSize: "13px" }}>
                                {blocked ? "Unavailable" : `${requiredAge}+`}
                              </strong>
                              <small
                                style={{ color: "rgba(255,255,255,0.72)" }}
                              >
                                {blocked
                                  ? "Safety restricted"
                                  : "Age restricted"}
                              </small>
                            </div>
                          )}

                          <div className="poster-overlay">
                            <button
                              className="quick-play"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(game);
                              }}
                            >
                              ◉
                            </button>
                          </div>
                        </div>

                        <div className="poster-info">
                          <h3>{game.name}</h3>

                          <div className="poster-meta">
                            <span className="genre">Action</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {filteredHorizontal.length === 0 &&
                filteredPosters.length === 0 && (
                  <div className="no-results">
                    <div>🎮</div>
                    <h2>No games found</h2>
                    <p>Try searching for another game.</p>
                  </div>
                )}
            </section>
          </main>
        </>
      )}
    </>
  );
}
