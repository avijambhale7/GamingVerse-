/* =========================================================
   GAMER PROFILE
   Profile card, reviews, collections and the follow modal.
   Rendered by ../../Profile.jsx.
========================================================= */

import { formatGameName, getGameImage } from "../utils/gameImages.js";
import AppTopNav from "../../../components/AppTopNav.jsx";
import AppBottomNav from "../../../components/AppBottomNav.jsx";

export default function ProfileView({
  activeTab,
  collectionGames,
  filter,
  filteredReviews,
  formatAge,
  fullName,
  handleLogout,
  myReviews,
  navigate,
  openSocialModal,
  playedGames,
  playLaterGames,
  profile,
  reviewSearch,
  reviewViewMode,
  setActiveTab,
  setFilter,
  setIsEditing,
  setReviewSearch,
  setReviewViewMode,
  setShowReviewSearch,
  setSocialModal,
  showReviewSearch,
  socialLists,
  socialLoading,
  socialMembers,
  socialModal,
  user,
  verdictLabel,
}) {
  return (
    <div className="profile-page">
      <header className="profile-header">
        <button
          className="profile-logo"
          type="button"
          onClick={() => navigate("/games")}
          aria-label="Go to GamingVerse home"
        >
          <span className="profile-logo-icon">🎮</span>

          <span className="profile-logo-text">
            <strong>GamingVerse</strong>
            <small>Level up your gaming experience</small>
          </span>
        </button>

        {/* Profile has its own page/route, so it never showed the Games
            page's nav bar — this is the exact same AppTopNav Games uses,
            so navigation looks and behaves identically on every page. */}
        <AppTopNav />
      </header>

      <main className="profile-content gv-page-enter">
        <section className="profile-left-card">
          <div className="profile-avatar">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" />
            ) : (
              <span>
                {(profile.firstName || profile.username || "G")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <h1>{fullName}</h1>
          <p className="profile-username">@{profile.username}</p>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div>
              <strong>{myReviews.length}</strong>
              <span>
                Reviews
                <br />
                Posted
              </span>
            </div>

            <div>
              <strong>0</strong>
              <span>
                Public
                <br />
                Collections
              </span>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-line">
              <span>♟</span>
              <strong>0 Followers</strong>
              <b>•</b>
              <strong>0 Following</strong>

              <button
                type="button"
                className="social-count-button social-followers-button"
                onClick={() => openSocialModal("followers")}
              >
                {socialLists.followers.length} Followers
              </button>
              <button
                type="button"
                className="social-count-button social-following-button"
                onClick={() => openSocialModal("following")}
              >
                {socialLists.following.length} Following
              </button>
            </div>

            <div className="profile-detail-line">
              <span>▣</span>
              <strong>
                Joined{" "}
                {user.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    )
                  : "GamingVerse"}
              </strong>
            </div>
          </div>

          <button
            className="edit-profile-button"
            type="button"
            onClick={() => setIsEditing(true)}
          >
            ✎ Edit Profile
          </button>

          <button
            className="logout-profile-button"
            type="button"
            onClick={handleLogout}
          >
            ↪ Log Out
          </button>
        </section>

        <section className="profile-middle">
          <div className="profile-tabs">
            <button
              className={
                activeTab === "reviews" ? "profile-tab active" : "profile-tab"
              }
              type="button"
              onClick={() => setActiveTab("reviews")}
            >
              ✎ <span>Reviews</span>
            </button>

            <button
              className={
                activeTab === "collections"
                  ? "profile-tab active"
                  : "profile-tab"
              }
              type="button"
              onClick={() => setActiveTab("collections")}
            >
              ▱ <span>Collections</span>
            </button>
          </div>

          {activeTab === "reviews" ? (
            <>
              <div className="profile-filter-row">
                {[
                  ["all", "All"],
                  ["skip", "Skip"],
                  ["timepass", "Timepass"],
                  ["go-for-it", "Go For It"],
                  ["perfection", "Perfection"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={
                      filter === value ? "filter-btn active" : "filter-btn"
                    }
                    type="button"
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}

                <div className="review-view-tools">
                  <button
                    type="button"
                    className={
                      reviewViewMode === "list"
                        ? "view-tool active"
                        : "view-tool"
                    }
                    title="List view"
                    aria-label="List view"
                    onClick={() => setReviewViewMode("list")}
                  >
                    ☷
                  </button>
                  <button
                    type="button"
                    className={
                      reviewViewMode === "grid"
                        ? "view-tool active"
                        : "view-tool"
                    }
                    title="Grid view"
                    aria-label="Grid view"
                    onClick={() => setReviewViewMode("grid")}
                  >
                    ▦
                  </button>
                  <button
                    type="button"
                    className={
                      showReviewSearch ? "view-tool active" : "view-tool"
                    }
                    title="Search your reviews"
                    aria-label="Search your reviews"
                    onClick={() =>
                      setShowReviewSearch((current) => {
                        if (current) setReviewSearch("");
                        return !current;
                      })
                    }
                  >
                    ⌕
                  </button>
                </div>
              </div>

              {showReviewSearch && (
                <input
                  type="search"
                  className="review-search-input"
                  value={reviewSearch}
                  onChange={(event) => setReviewSearch(event.target.value)}
                  placeholder="Search your reviews by game name..."
                  autoFocus
                />
              )}

              {filteredReviews.length === 0 ? (
                <div className="profile-empty-state">
                  <div className="empty-icon">✎</div>

                  <h2>
                    {myReviews.length === 0
                      ? "You haven't posted any reviews yet"
                      : "No reviews match this filter"}
                  </h2>

                  <p>
                    {myReviews.length === 0
                      ? "Start sharing your opinions on games with the GamingVerse community."
                      : "Try another review category to see your posts."}
                  </p>

                  {myReviews.length === 0 && (
                    <button type="button" onClick={() => navigate("/games")}>
                      Explore Games
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={
                    reviewViewMode === "grid"
                      ? "my-reviews-list my-reviews-grid"
                      : "my-reviews-list"
                  }
                >
                  {filteredReviews.map((review) => (
                    <article
                      className="my-review-card my-review-card-clickable"
                      key={review.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/games?openGame=${encodeURIComponent(
                            review.gameName,
                          )}&return=profile&tab=reviews`,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(
                            `/games?openGame=${encodeURIComponent(
                              review.gameName,
                            )}&return=profile&tab=reviews`,
                          );
                        }
                      }}
                    >
                      <div className="my-review-head">
                        <div className="my-review-game">
                          <div className="my-review-game-icon">
                            {getGameImage(review.gameName) ||
                            review.gameImage ? (
                              <img
                                src={
                                  getGameImage(review.gameName) ||
                                  review.gameImage
                                }
                                alt={review.gameName}
                                loading="lazy"
                              />
                            ) : (
                              <span aria-hidden="true">🎮</span>
                            )}
                          </div>

                          <div>
                            <h3>{review.gameName}</h3>
                            <span>{formatAge(review.createdAt)}</span>
                          </div>
                        </div>

                        <span
                          className={`my-review-verdict ${
                            review.verdict || "timepass"
                          }`}
                        >
                          {verdictLabel[review.verdict] || "REVIEW"}
                        </span>
                      </div>

                      {review.text ? (
                        <p className="my-review-text">{review.text}</p>
                      ) : (
                        <p className="my-review-text my-review-text-empty">
                          No written comment — verdict only.
                        </p>
                      )}

                      <div className="my-review-footer">
                        <span>♡ {review.likes || 0}</span>
                        <span>◯ {review.comments || 0}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="profile-collections-view">
              <div className="profile-collections-header">
                <div>
                  <span className="profile-collections-kicker">
                    YOUR LIBRARY
                  </span>
                  <h2>Collections</h2>
                  <p>
                    Everything you save is organized here so you can find it
                    quickly.
                  </p>
                </div>
              </div>

              <div className="profile-collections-three-column">
                {/* COLLECTIONS */}
                <section className="profile-library-panel">
                  <div className="profile-library-heading">
                    <div>
                      <span>SAVED</span>
                      <h3>Collections</h3>
                    </div>
                    <b>{collectionGames.length}</b>
                  </div>

                  {collectionGames.length > 0 ? (
                    <div className="profile-library-list">
                      {collectionGames.map((gameName) => {
                        const image = getGameImage(gameName);
                        return (
                          <button
                            className="profile-library-item profile-library-item-button"
                            type="button"
                            title={`Open ${formatGameName(gameName)}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "gamingverse_open_game",
                                gameName,
                              );
                              navigate(
                                `/games?openGame=${encodeURIComponent(gameName)}&return=profile`,
                              );
                            }}
                          >
                            <div className="profile-library-image">
                              {image ? (
                                <img
                                  src={image}
                                  alt={gameName}
                                  loading="lazy"
                                />
                              ) : (
                                <span aria-hidden="true">🎮</span>
                              )}
                            </div>
                            <div className="profile-library-copy">
                              <strong>{formatGameName(gameName)}</strong>
                              <small>Saved to collection</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="profile-library-empty">
                      <span>♧</span>
                      <strong>No saved games</strong>
                      <small>Use Collections on a game to add it here.</small>
                    </div>
                  )}
                </section>

                {/* PLAYED */}
                <section className="profile-library-panel profile-played-panel">
                  <div className="profile-library-heading">
                    <div>
                      <span>HISTORY</span>
                      <h3>Marked as Played</h3>
                    </div>
                    <b>{playedGames.length}</b>
                  </div>

                  {playedGames.length > 0 ? (
                    <div className="profile-library-list">
                      {playedGames.map((gameName) => {
                        const image = getGameImage(gameName);
                        return (
                          <button
                            className="profile-library-item profile-library-item-button"
                            type="button"
                            title={`Open ${formatGameName(gameName)}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "gamingverse_open_game",
                                gameName,
                              );
                              navigate(
                                `/games?openGame=${encodeURIComponent(gameName)}&return=profile`,
                              );
                            }}
                          >
                            <div className="profile-library-image">
                              {image ? (
                                <img
                                  src={image}
                                  alt={gameName}
                                  loading="lazy"
                                />
                              ) : (
                                <span aria-hidden="true">🎮</span>
                              )}
                            </div>
                            <div className="profile-library-copy">
                              <strong>{formatGameName(gameName)}</strong>
                              <small>Marked as played</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="profile-library-empty">
                      <span>✓</span>
                      <strong>No played games</strong>
                      <small>Use Mark as played from a game's details.</small>
                    </div>
                  )}
                </section>

                {/* PLAY LATER */}
                <section className="profile-library-panel profile-later-panel">
                  <div className="profile-library-heading">
                    <div>
                      <span>UP NEXT</span>
                      <h3>Play Later</h3>
                    </div>
                    <b>{playLaterGames.length}</b>
                  </div>

                  {playLaterGames.length > 0 ? (
                    <div className="profile-library-list">
                      {playLaterGames.map((gameName) => {
                        const image = getGameImage(gameName);
                        return (
                          <button
                            className="profile-library-item profile-library-item-button"
                            type="button"
                            title={`Open ${formatGameName(gameName)}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "gamingverse_open_game",
                                gameName,
                              );
                              navigate(
                                `/games?openGame=${encodeURIComponent(gameName)}&return=profile`,
                              );
                            }}
                          >
                            <div className="profile-library-image">
                              {image ? (
                                <img
                                  src={image}
                                  alt={gameName}
                                  loading="lazy"
                                />
                              ) : (
                                <span aria-hidden="true">🎮</span>
                              )}
                            </div>
                            <div className="profile-library-copy">
                              <strong>{formatGameName(gameName)}</strong>
                              <small>Saved for later</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="profile-library-empty">
                      <span>◷</span>
                      <strong>No games for later</strong>
                      <small>
                        Use Play Later on a game you want to return to.
                      </small>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </section>
      </main>

      {socialModal && (
        <div
          className="social-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSocialModal(null);
          }}
        >
          <section
            className="social-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-modal-title"
          >
            <div className="social-modal-header">
              <h2 id="social-modal-title">
                {socialModal === "followers" ? "Followers" : "Following"}
              </h2>
              <button
                type="button"
                className="social-modal-close"
                aria-label="Close"
                onClick={() => setSocialModal(null)}
              >
                ×
              </button>
            </div>

            <div className="social-modal-list">
              {socialLoading ? (
                <div className="social-modal-empty">Loading...</div>
              ) : socialMembers.length === 0 ? (
                <div className="social-modal-empty">
                  {socialModal === "followers"
                    ? "No followers yet."
                    : "Not following anyone yet."}
                </div>
              ) : (
                socialMembers.map((member, index) => (
                  <div
                    className="social-user-row"
                    key={member.uid || `${member.username}-${index}`}
                  >
                    <div className="social-user-avatar">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt="" />
                      ) : (
                        <span>
                          {member.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="social-user-copy">
                      <strong>{member.displayName}</strong>
                      <span>@{member.username}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <AppBottomNav />
    </div>
  );
}
