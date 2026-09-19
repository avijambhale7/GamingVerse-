/* =========================================================
   SPACES VIEW
   Trailers, gaming news and the gaming clubs hub.
   Rendered by ../../Games.jsx.
========================================================= */

import { auth } from "../../../firebase";
import { CLUB_INTERESTS, getClubInterestMeta } from "../data/clubs.js";
import { formatActivityDate } from "../utils/text.js";
import { getGameDetails } from "../utils/gameInfo.js";
import { horizontalGames } from "../utils/catalogue.js";

export default function SpacesView({
  activeView,
  closeClub,
  clubDiscussions,
  clubInterest,
  clubPost,
  clubSearch,
  communityTalkPost,
  communityTalks,
  createGamingClub,
  fetchLiveGamingNews,
  filteredGamingClubs,
  filteredHorizontal,
  filteredPosters,
  gamingClubs,
  joinedClubIds,
  leaveClub,
  liveNews,
  newClubDescription,
  newClubInterest,
  newClubName,
  newsError,
  newsItems,
  newsLoading,
  newsUpdatedAt,
  openClub,
  openDetails,
  postClubDiscussion,
  postCommunityTalk,
  selectedClubId,
  setActiveView,
  setClubInterest,
  setClubPost,
  setClubSearch,
  setCommunityTalkPost,
  setNewClubDescription,
  setNewClubInterest,
  setNewClubName,
  setSelectedClubId,
  setShowCreateClub,
  setSpacesSection,
  showCreateClub,
  spacesSection,
  toggleClubMembership,
}) {
  return (
    <>
      {(activeView === "trailers" ||
        activeView === "news" ||
        activeView === "clubs") && (
        <section className="trailers-page">
          <div className="trailers-layout">
            <aside className="trailers-sidebar">
              <div className="trailers-sidebar-title">EXPLORE</div>

              <button
                className={`trailers-side-item ${
                  activeView === "trailers" ? "active" : ""
                }`}
                type="button"
                onClick={() => {
                  setActiveView("trailers");
                  setSpacesSection("feed");
                  setSelectedClubId(null);
                }}
              >
                <span className="sidebar-nav-icon">⌂</span>
                <span>Feed</span>
              </button>

              <button
                className={`trailers-side-item ${
                  activeView === "news" ? "active" : ""
                }`}
                type="button"
                onClick={() => setActiveView("news")}
              >
                <span className="sidebar-nav-icon">▤</span>
                <span>News</span>
              </button>

              <button
                className={`trailers-side-item ${
                  activeView === "clubs" ? "active" : ""
                }`}
                type="button"
                onClick={() => {
                  setActiveView("clubs");
                  setSpacesSection("clubs");
                  setSelectedClubId(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="sidebar-nav-icon">♣</span>
                <span>Gaming Clubs</span>
              </button>
            </aside>

            {activeView === "news" ? (
              <main className="news-feed">
                <div className="news-feed-header">
                  <div>
                    <span className="section-label">LATEST GAMING NEWS</span>
                    <h1>Gaming News</h1>
                    <p>Fresh gaming headlines and industry updates.</p>
                  </div>
                  <button
                    type="button"
                    className={`news-date-pill ${newsLoading ? "is-loading" : ""}`}
                    onClick={fetchLiveGamingNews}
                    disabled={newsLoading}
                    title="Refresh live gaming news"
                  >
                    <span
                      className={
                        newsLoading ? "news-live-dot loading" : "news-live-dot"
                      }
                    >
                      ●
                    </span>
                    <span>
                      {newsLoading
                        ? "Updating live news..."
                        : newsUpdatedAt
                          ? `Live • Updated ${newsUpdatedAt.toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}`
                          : "Live news • Click to refresh"}
                    </span>
                    <span className="news-refresh-button" aria-hidden="true">
                      ↻
                    </span>
                  </button>

                  {newsError && (
                    <div className="news-live-note">{newsError}</div>
                  )}
                </div>

                <div className="news-layout">
                  <div className="news-main-grid">
                    {newsItems.slice(0, 6).map((news, index) => {
                      const game =
                        horizontalGames.find(
                          (item) =>
                            item.name.toLowerCase() ===
                            news.imageGame.toLowerCase(),
                        ) ||
                        horizontalGames[
                          index % Math.max(horizontalGames.length, 1)
                        ];

                      return (
                        <article
                          className={`news-card ${
                            index === 0 ? "featured" : ""
                          }`}
                          key={news.id}
                        >
                          <div className="news-card-image">
                            {(news.image || game?.image) && (
                              <img src={news.image || game.image} alt="" />
                            )}
                            <span className="news-card-tag">{news.tag}</span>
                          </div>

                          <div className="news-card-body">
                            <div className="news-source-row">
                              <span>{news.source}</span>
                              <span>•</span>
                              <span>{news.time}</span>
                            </div>

                            <h2>{news.title}</h2>
                            <p>{news.summary}</p>

                            <a
                              href={news.url}
                              target="_blank"
                              rel="noreferrer"
                              className="news-read-button"
                            >
                              Read News →
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <aside className="news-sidebar">
                    <div className="news-sidebar-title">
                      <span>⚡</span>
                      <h2>Top Stories</h2>
                    </div>

                    <div className="news-top-list">
                      {newsItems.slice(6, 8).map((news, index) => {
                        const game =
                          horizontalGames.find(
                            (item) =>
                              item.name.toLowerCase() ===
                              news.imageGame.toLowerCase(),
                          ) ||
                          horizontalGames[
                            (index + 6) % Math.max(horizontalGames.length, 1)
                          ];

                        return (
                          <a
                            key={news.id}
                            href={news.url}
                            target="_blank"
                            rel="noreferrer"
                            className="news-top-item"
                          >
                            {(news.image || game?.image) && (
                              <img src={news.image || game.image} alt="" />
                            )}
                            <span>
                              <small>{news.tag}</small>
                              <strong>{news.title}</strong>
                              <em>{news.time}</em>
                            </span>
                          </a>
                        );
                      })}
                    </div>

                    <div className="news-source-note">
                      <strong>
                        {liveNews.length ? "Live sources" : "Saved sources"}
                      </strong>
                      <p>
                        {liveNews.length
                          ? "Headlines are fetched automatically and refreshed every 10 minutes."
                          : "News links open the original publisher or reporting source."}
                      </p>
                    </div>
                  </aside>
                </div>
              </main>
            ) : activeView === "clubs" || spacesSection === "clubs" ? (
              <main className="clubs-feed">
                {selectedClubId &&
                  (() => {
                    const selectedClub = gamingClubs.find(
                      (club) => club.id === selectedClubId,
                    );
                    if (!selectedClub) return null;
                    const joined = joinedClubIds.includes(selectedClub.id);
                    const clubMembers = selectedClub.memberCount || 0;

                    return (
                      <section className="club-open-page">
                        <div
                          className="club-open-hero"
                          style={{ "--club-accent": selectedClub.accent }}
                        >
                          <div className="club-open-icon">
                            {getClubInterestMeta(selectedClub.interest).icon}
                          </div>
                          <div className="club-open-heading">
                            <span>{selectedClub.interest}</span>
                            <h1>{selectedClub.name}</h1>
                          </div>
                          <button
                            type="button"
                            className="club-open-close"
                            onClick={closeClub}
                            aria-label="Close club"
                          >
                            ×
                          </button>
                        </div>

                        <div className="club-open-content">
                          <p className="club-open-description">
                            {selectedClub.description}
                          </p>

                          <div className="club-open-meta">
                            <span>♟ {clubMembers} members</span>
                            <span>● {selectedClub.interest}</span>
                            <span>{joined ? "✓ Joined" : "Not joined"}</span>
                          </div>

                          <section className="club-whatsapp-chat">
                            <header className="club-whatsapp-header">
                              <div className="club-whatsapp-avatar">♣</div>
                              <div className="club-whatsapp-title">
                                <strong>{selectedClub.name}</strong>
                                <span>
                                  {clubMembers} members •{" "}
                                  {joined ? "Online" : "View only"}
                                </span>
                              </div>
                              <div
                                className="club-whatsapp-actions"
                                aria-hidden="true"
                              >
                                <span>⌕</span>
                                <span>⋮</span>
                              </div>
                            </header>

                            <div className="club-whatsapp-messages">
                              <div className="club-chat-day">TODAY</div>
                              {clubDiscussions.length ? (
                                clubDiscussions.slice(0, 20).map((discussion) => {
                                  const isMine =
                                    discussion.authorUid ===
                                    auth.currentUser?.uid;
                                  return (
                                    <div
                                      className={`club-chat-message-row ${isMine ? "mine" : "theirs"}`}
                                      key={discussion.id}
                                    >
                                      {!isMine && (
                                        <div className="club-chat-avatar">
                                          {(discussion.author || "G")
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                      )}
                                      <div className="club-chat-bubble">
                                        {!isMine && (
                                          <span className="club-chat-author">
                                            @{discussion.author || "Gamer"}
                                          </span>
                                        )}
                                        <p>{discussion.title}</p>
                                        <span className="club-chat-time">
                                          {formatActivityDate(
                                            discussion.createdAt,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="club-empty-state club-chat-empty">
                                  No messages yet. Start the conversation.
                                </div>
                              )}
                            </div>

                            {joined ? (
                              <form
                                className="club-whatsapp-composer"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  postClubDiscussion();
                                }}
                              >
                                <button
                                  type="button"
                                  className="club-chat-emoji"
                                  aria-label="Add emoji"
                                >
                                  ☺
                                </button>
                                <input
                                  value={clubPost}
                                  onChange={(event) =>
                                    setClubPost(event.target.value)
                                  }
                                  placeholder="Type a message"
                                  maxLength={140}
                                />
                                <button
                                  type="submit"
                                  className="club-chat-send"
                                  aria-label="Send message"
                                >
                                  ➤
                                </button>
                              </form>
                            ) : (
                              <div className="club-chat-join-note">
                                Join the club to send messages.
                              </div>
                            )}
                          </section>

                          <div className="club-open-footer">
                            <button
                              type="button"
                              className="club-open-back"
                              onClick={closeClub}
                            >
                              ← Back to Clubs
                            </button>

                            {joined && (
                              <button
                                type="button"
                                className="club-open-leave"
                                onClick={() => leaveClub(selectedClub.id)}
                              >
                                Leave Club
                              </button>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                {!selectedClubId && (
                  <>
                    <div className="clubs-feed-head">
                      <div>
                        <span className="section-label">COMMUNITY</span>
                        <h1>Gaming Clubs</h1>
                        <p>
                          Create and join gaming clubs, share gaming interests,
                          discuss your favourite games and meet other gamers.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="clubs-create-button"
                        onClick={() => setShowCreateClub((current) => !current)}
                      >
                        {showCreateClub ? "Close" : "+ Create Club"}
                      </button>
                    </div>

                    {showCreateClub && (
                      <section className="club-create-panel">
                        <div className="club-create-grid">
                          <label>
                            Club Name
                            <input
                              value={newClubName}
                              onChange={(event) =>
                                setNewClubName(event.target.value)
                              }
                              placeholder="e.g. Open World Legends"
                              maxLength={50}
                            />
                          </label>

                          <label>
                            Interest
                            <select
                              value={newClubInterest}
                              onChange={(event) =>
                                setNewClubInterest(event.target.value)
                              }
                            >
                              {CLUB_INTERESTS.map(({ id, icon }) => (
                                <option key={id} value={id}>
                                  {icon} {id}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label className="club-create-description">
                          Description
                          <textarea
                            value={newClubDescription}
                            onChange={(event) =>
                              setNewClubDescription(event.target.value)
                            }
                            placeholder="Tell gamers what your club is about..."
                            maxLength={180}
                          />
                        </label>

                        <button
                          type="button"
                          className="clubs-create-submit"
                          onClick={createGamingClub}
                        >
                          Create & Join Club
                        </button>
                      </section>
                    )}

                    <div className="clubs-toolbar">
                      <div className="club-interest-filters">
                        <button
                          type="button"
                          className={clubInterest === "All" ? "active" : ""}
                          onClick={() => setClubInterest("All")}
                        >
                          ✦ All
                        </button>
                        {CLUB_INTERESTS.map(({ id, icon }) => (
                          <button
                            key={id}
                            type="button"
                            className={clubInterest === id ? "active" : ""}
                            style={{ "--interest-color": getClubInterestMeta(id).color }}
                            onClick={() => setClubInterest(id)}
                          >
                            {icon} {id}
                          </button>
                        ))}
                      </div>

                      <label className="club-search">
                        <span>⌕</span>
                        <input
                          value={clubSearch}
                          onChange={(event) =>
                            setClubSearch(event.target.value)
                          }
                          placeholder="Search clubs..."
                        />
                      </label>
                    </div>

                    <section className="clubs-block">
                      <div className="clubs-block-heading">
                        <div>
                          <span className="section-label">
                            FIND YOUR COMMUNITY
                          </span>
                          <h2>Clubs for Gamers</h2>
                        </div>
                        <span>{filteredGamingClubs.length} clubs</span>
                      </div>

                      <div className="clubs-grid">
                        {filteredGamingClubs.map((club) => {
                          const joined = joinedClubIds.includes(club.id);
                          return (
                            <article
                              className="gaming-club-card"
                              key={club.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openClub(club.id)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  openClub(club.id);
                                }
                              }}
                            >
                              <div
                                className="gaming-club-card-top"
                                style={{ "--club-accent": club.accent }}
                              >
                                <div className="gaming-club-icon">
                                  {getClubInterestMeta(club.interest).icon}
                                </div>
                                <span className="gaming-club-tag">
                                  {club.interest}
                                </span>
                              </div>

                              <div className="gaming-club-card-body">
                                <h3>{club.name}</h3>
                                <p>{club.description}</p>

                                <div className="gaming-club-card-footer">
                                  <span>👥 {club.memberCount || 0} members</span>
                                  <button
                                    type="button"
                                    className={joined ? "joined" : ""}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleClubMembership(club.id);
                                    }}
                                  >
                                    {joined ? "Joined ✓" : "Join Club"}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {!filteredGamingClubs.length && (
                        <div className="clubs-feature-note">
                          <strong>No clubs found</strong>
                          <span>Try another interest or search term.</span>
                        </div>
                      )}
                    </section>

                    <section className="community-chat-panel">
                      <div className="community-chat-header">
                        <div className="community-chat-avatar">💬</div>
                        <div>
                          <span className="section-label">COMMUNITY</span>
                          <h2>Community Talks</h2>
                          <p>GamingVerse community chat</p>
                        </div>
                        <span className="community-chat-online">● Online</span>
                      </div>

                      <div className="community-chat-messages">
                        {communityTalks.slice(0, 12).map((discussion) => {
                          const isMine =
                            discussion.authorUid === auth.currentUser?.uid;

                          return (
                            <article
                              className={`community-message ${isMine ? "mine" : ""}`}
                              key={discussion.id}
                            >
                              {!isMine && (
                                <div className="community-message-avatar">
                                  {(discussion.author || "G")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div className="community-message-bubble">
                                {!isMine && (
                                  <strong>
                                    @{discussion.author || "Gamer"}
                                  </strong>
                                )}
                                <div className="community-message-text">
                                  {discussion.title}
                                </div>
                                <span className="community-message-time">
                                  {formatActivityDate(discussion.createdAt)}
                                </span>
                              </div>
                            </article>
                          );
                        })}

                        {!communityTalks.length && (
                          <div className="community-chat-empty">
                            <span>💬</span>
                            <strong>No messages yet</strong>
                            <p>
                              Start the conversation with the GamingVerse
                              community.
                            </p>
                          </div>
                        )}
                      </div>

                      <form
                        className="community-chat-composer"
                        onSubmit={(event) => {
                          event.preventDefault();
                          postCommunityTalk();
                        }}
                      >
                        <input
                          value={communityTalkPost}
                          onChange={(event) =>
                            setCommunityTalkPost(event.target.value)
                          }
                          placeholder="Type a message..."
                          maxLength={140}
                        />
                        <button type="submit" aria-label="Send message">
                          ➤
                        </button>
                      </form>
                    </section>

                    <div className="clubs-feature-note">
                      <strong>Gaming Clubs</strong>
                      <span>
                        Connect with other gamers based on shared interests and
                        participate in discussions.
                      </span>
                    </div>
                  </>
                )}
              </main>
            ) : (
              <main className="trailers-feed">
                <div className="trailers-feed-head">
                  <div>
                    <span className="section-label">WATCH NOW</span>
                    <h1>Latest Spaces</h1>
                    <p>
                      Discover new game reveals, gameplay footage and featured
                      gaming content.
                    </p>
                  </div>

                  <div className="trailers-search-pill">
                    <span>🔍</span>
                    <span>
                      {filteredHorizontal.slice(0, 8).length} trailers
                    </span>
                  </div>
                </div>

                <div className="trailers-list">
                  {filteredHorizontal.slice(0, 8).map((game, index) => {
                    const details = getGameDetails(game.name);
                    const trailerLink =
                      details.trailerUrl || details.trailerSearchUrl;
                    return (
                      <article
                        className={`trailer-post ${index === 0 ? "featured" : ""}`}
                        key={`trailer-post-${game.name}-${index}`}
                      >
                        <a
                          className="trailer-media"
                          href={trailerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Watch ${game.name} trailer`}
                        >
                          <img src={game.image} alt={game.name} />
                          <span className="trailer-media-shade"></span>
                          <span className="trailer-play">▶</span>
                          <span className="trailer-media-label">
                            {index === 0 ? "★ FEATURED" : "▶ TRAILER"}
                          </span>
                        </a>

                        <div className="trailer-post-copy">
                          <h2>
                            Featured content for <strong>{game.name}</strong> is
                            here.
                          </h2>

                          <p>{details.description}</p>

                          <div className="trailer-post-meta">
                            <span>GamingVerse</span>
                            <span>•</span>
                            <span>Featured Game</span>
                          </div>
                        </div>

                        <div className="trailer-post-actions">
                          <a
                            className="trailer-watch-link"
                            href={trailerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Space ↗
                          </a>

                          <button
                            className="trailer-comment-button"
                            type="button"
                            onClick={() => openDetails(game)}
                            aria-label={`Open ${game.name}`}
                          >
                            ◌
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </main>
            )}

            <aside className="trailers-promo">
              <div className="trailers-promo-kicker">FEATURED</div>

              <div className="trailers-promo-card">
                {filteredPosters[0] ? (
                  <img
                    src={filteredPosters[0].image}
                    alt={filteredPosters[0].name}
                    className="trailers-promo-image"
                  />
                ) : null}

                <div className="trailers-promo-overlay"></div>

                <div className="trailers-promo-copy">
                  <span>GamingVerse Spotlight</span>
                  <h3>{filteredPosters[0]?.name || "Game Spotlight"}</h3>

                  <button
                    type="button"
                    onClick={() => {
                      if (filteredPosters[0]) {
                        openDetails(filteredPosters[0]);
                      }
                    }}
                  >
                    Open Game ↗
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}
      {/* ===================================================
            GAME DETAILS MODAL
        =================================================== */}
    </>
  );
}
