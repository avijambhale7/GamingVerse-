/* =========================================================
   GAME DETAILS
   Cinematic hero, GamingVerse meter and community reviews.
   Rendered by ../../Games.jsx.
========================================================= */

import { useEffect, useRef, useState } from "react";
import { auth } from "../../../firebase";
import {
  extractYouTubeId,
  getGameMediaFallback,
  getVerifiedTrailerUrl,
} from "../utils/media.js";
import { getGameDetails } from "../utils/gameInfo.js";
import { normalizeTrailerGameName } from "../utils/text.js";
import { reviewOptions } from "../data/reviewOptions.js";
import ReviewCard from "./ReviewCard.jsx";

/* Geometry of the semicircular meter gauge. The path is a half
   circle of GAUGE_RADIUS drawn left to right, so an arc segment
   of length `share * PI * GAUGE_RADIUS` covers that share of it. */
const GAUGE_RADIUS = 88;
const GAUGE_PATH = "M 12 100 A 88 88 0 0 1 188 100";

/* Drawn in this order, worst verdict first, so the arc reads from
   the left exactly like the legend underneath it. */
const METER_SEGMENTS = [
  { key: "skip", tone: "skip" },
  { key: "timepass", tone: "timepass" },
  { key: "go-for-it", tone: "go" },
  { key: "perfection", tone: "perfection" },
];

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/* Eases a number towards its target over `duration`. The arc animates when
   a vote lands; without this the headline percentage would snap while the
   arc was still sliding, and a one-point change would be easy to miss. */
function useCountUp(target, duration = 550) {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);
  const frameRef = useRef(0);

  useEffect(() => {
    if (PREFERS_REDUCED_MOTION) return undefined;

    const from = currentRef.current;
    if (from === target) return undefined;

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  // Readers who asked for less motion get the final value straight away.
  return PREFERS_REDUCED_MOTION ? target : display;
}

export default function GameDetailsModal({
  closeDetails,
  collectionGames,
  composerVerdict,
  formatReviewAge,
  likedReviewIds,
  meterPercent,
  openPoster,
  positiveVotes,
  openTrailer,
  postCommunityReview,
  reviewCounts,
  reviewLoading,
  reviewMessage,
  reviewText,
  selectedGame,
  setComposerVerdict,
  setReviewText,
  showDetails,
  toggleCollection,
  deleteMyReview,
  deleteReviewComment,
  postReviewComment,
  toggleReviewLike,
  toggleWatchLater,
  toggleWatched,
  top100FormatVotes,
  totalVotes,
  trailerMediaMap,
  visibleCommunityReviews,
  watchLaterGames,
  watchedGames,
}) {
  const animatedPercent = useCountUp(meterPercent);

  return (
    <>
      {selectedGame && showDetails && (
        <div className="details-backdrop" onClick={closeDetails}>
          <section
            className="details-modal details-modal-reference"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="details-close"
              type="button"
              onClick={closeDetails}
              aria-label="Close details"
            >
              ×
            </button>

            {(() => {
              const details = getGameDetails(selectedGame.name);
              // A game that hasn't released yet can't have been "played",
              // so swap that action to expressing interest instead.
              const isUpcoming =
                Boolean(details.releaseDate) &&
                details.releaseDate !== "TBA" &&
                !Number.isNaN(new Date(details.releaseDate).getTime()) &&
                new Date(details.releaseDate) > new Date();
              const trailerKey = normalizeTrailerGameName(selectedGame.name);
              const liveTrailerMedia = trailerMediaMap[trailerKey];
              const heroTrailerUrl =
                (liveTrailerMedia?.type === "youtube"
                  ? liveTrailerMedia.url
                  : "") ||
                getVerifiedTrailerUrl(selectedGame.name) ||
                String(
                  selectedGame?.trailerUrl ||
                    details.trailerUrl ||
                    getGameMediaFallback(selectedGame.name)?.trailer ||
                    "",
                ).trim();
              const heroTrailerId = extractYouTubeId(heroTrailerUrl);
              const heroThumbnailUrl = heroTrailerId
                ? `https://i.ytimg.com/vi/${heroTrailerId}/maxresdefault.jpg`
                : selectedGame?.heroImage ||
                  selectedGame?.image ||
                  getGameMediaFallback(selectedGame.name)?.hero ||
                  "";

              return (
                <>
                  <section className="reference-game-hero">
                    <div className="reference-game-hero-media">
                      <img
                        className="reference-game-hero-thumbnail-image"
                        src={
                          heroThumbnailUrl ||
                          selectedGame?.heroImage ||
                          selectedGame?.image ||
                          getGameMediaFallback(selectedGame.name)?.hero ||
                          ""
                        }
                        alt=""
                        aria-hidden="true"
                        onError={(event) => {
                          const fallbackImage =
                            selectedGame?.heroImage ||
                            selectedGame?.image ||
                            getGameMediaFallback(selectedGame.name)?.hero ||
                            "";
                          if (
                            fallbackImage &&
                            event.currentTarget.src !== fallbackImage
                          ) {
                            event.currentTarget.src = fallbackImage;
                          }
                        }}
                      />
                      <div className="reference-game-hero-thumbnail-shade" />

                      {/* Always show the trailer control on the game details hero.
                          openTrailer() resolves a verified/RAWG trailer when needed. */}
                      <button
                        className="reference-game-hero-play"
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openTrailer(selectedGame);
                        }}
                        aria-label={`Play ${details.title} trailer`}
                      >
                        ▶
                      </button>
                    </div>

                    <div className="reference-game-hero-scrim" />

                    <div className="reference-game-hero-content">
                      <div className="reference-game-hero-left">
                        <button
                          className="reference-game-hero-poster-button"
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            openPoster(selectedGame);
                          }}
                          aria-label={`View ${selectedGame.name} poster`}
                        >
                          <img
                            className="reference-game-hero-poster"
                            src={
                              selectedGame.image ||
                              getGameMediaFallback(selectedGame.name)?.poster ||
                              (() => {
                                const trailer =
                                  getVerifiedTrailerUrl(selectedGame.name) ||
                                  selectedGame.trailerUrl ||
                                  "";
                                const id = extractYouTubeId(trailer);
                                return id
                                  ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                                  : "";
                              })()
                            }
                            alt={selectedGame.name}
                            onError={(event) => {
                              const fallbackPoster =
                                getGameMediaFallback(selectedGame.name)
                                  ?.poster ||
                                (() => {
                                  const trailer =
                                    getVerifiedTrailerUrl(selectedGame.name) ||
                                    selectedGame.trailerUrl ||
                                    "";
                                  const id = extractYouTubeId(trailer);
                                  return id
                                    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                                    : "";
                                })();
                              if (
                                fallbackPoster &&
                                event.currentTarget.src !== fallbackPoster
                              ) {
                                event.currentTarget.src = fallbackPoster;
                              }
                            }}
                          />
                        </button>

                        <div className="reference-game-hero-copy">
                          <span className="reference-hero-eyebrow">
                            GAMINGVERSE GAME GUIDE
                          </span>
                          <h2>{details.title}</h2>
                          <p>{details.description}</p>

                          <div className="reference-hero-meta">
                            <span>🎯 {details.genre}</span>
                            <span>🎮 {details.platforms}</span>
                            <span>📅 {details.releaseDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="reference-hero-actions">
                        <button
                          className={`reference-watch-button ${
                            isUpcoming ? "reference-interest-button" : ""
                          } ${
                            watchedGames.includes(selectedGame.name)
                              ? "is-active"
                              : ""
                          }`}
                          type="button"
                          onClick={toggleWatched}
                        >
                          {isUpcoming ? "🔔" : "👁"}{" "}
                          {watchedGames.includes(selectedGame.name)
                            ? isUpcoming
                              ? "Marked as Interested"
                              : "Marked as Played"
                            : isUpcoming
                              ? "Mark as Interested"
                              : "Mark as Played"}
                        </button>

                        {isUpcoming ? (
                          <>
                            <button
                              className={`reference-utility-button reference-collections-button reference-full-width-button ${
                                collectionGames.includes(selectedGame.name)
                                  ? "is-active"
                                  : ""
                              }`}
                              type="button"
                              onClick={toggleCollection}
                            >
                              🔖{" "}
                              {collectionGames.includes(selectedGame.name)
                                ? "In Collection"
                                : "Add to Collection"}
                            </button>

                            <button
                              className={`reference-utility-button reference-later-button reference-full-width-button ${
                                watchLaterGames.includes(selectedGame.name)
                                  ? "is-active"
                                  : ""
                              }`}
                              type="button"
                              onClick={toggleWatchLater}
                            >
                              ◷{" "}
                              {watchLaterGames.includes(selectedGame.name)
                                ? "Added to Play Later"
                                : "Play Later"}
                            </button>
                          </>
                        ) : (
                          <div className="reference-secondary-actions">
                            <button
                              className={`reference-utility-button reference-collections-button ${
                                collectionGames.includes(selectedGame.name)
                                  ? "is-active"
                                  : ""
                              }`}
                              type="button"
                              onClick={toggleCollection}
                            >
                              ♧{" "}
                              {collectionGames.includes(selectedGame.name)
                                ? "In Collections"
                                : "Collections"}
                            </button>

                            <button
                              className={`reference-utility-button reference-later-button ${
                                watchLaterGames.includes(selectedGame.name)
                                  ? "is-active"
                                  : ""
                              }`}
                              type="button"
                              onClick={toggleWatchLater}
                            >
                              ◷{" "}
                              {watchLaterGames.includes(selectedGame.name)
                                ? "Saved for Later"
                                : "Watch Later"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="reference-content-grid">
                    <main className="reference-overview">
                      <div className="reference-overview-kicker">
                        GAME OVERVIEW
                      </div>
                      <h3>Overview</h3>
                      <p className="reference-overview-text">
                        {details.about || details.description}
                      </p>

                      <div className="reference-tags">
                        <span>{details.genre}</span>
                        <span>{details.platforms}</span>
                        <span>GamingVerse Guide</span>
                      </div>

                      <div className="reference-section-divider" />

                      <div className="reference-story-grid">
                        <section className="reference-text-card">
                          <h4>📖 Story</h4>
                          <p>
                            {details.story ||
                              "Explore the game's world, characters and story."}
                          </p>
                        </section>

                        <section className="reference-text-card">
                          <h4>🎮 Gameplay</h4>
                          <p>
                            {details.gameplay ||
                              "Experience the game's core gameplay, exploration and progression."}
                          </p>
                        </section>
                      </div>

                      {details.features?.length > 0 && (
                        <section className="reference-features">
                          <h4>✨ Key Features</h4>
                          <div className="reference-feature-list">
                            {details.features
                              .slice(0, 8)
                              .map((feature, index) => (
                                <span key={`${feature}-${index}`}>
                                  ✓ {feature}
                                </span>
                              ))}
                          </div>
                        </section>
                      )}
                    </main>

                    <aside className="reference-info-panel">
                      <h3>Game Info</h3>
                      <div className="reference-info-item">
                        <span>Genre</span>
                        <strong>{details.genre}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Platforms</span>
                        <strong>{details.platforms}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Release Date</span>
                        <strong>{details.releaseDate}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Developer</span>
                        <strong>{details.developer}</strong>
                      </div>
                      <div className="reference-info-item">
                        <span>Publisher</span>
                        <strong>{details.publisher}</strong>
                      </div>
                    </aside>
                  </div>

                  {/* A game that hasn't released has no verdict and no
                      players to review it yet, so the meter and community
                      comments don't apply — only show them once it's out. */}
                  {!isUpcoming && (
                  <section
                    className="inline-gv-meter"
                    aria-label="GamingVerse Meter"
                  >
                    <div className="inline-gv-meter-heading">
                      {/* The reference titles this once. The eyebrow here
                          just repeated the heading in caps. */}
                      <h3>GamingVerse Meter</h3>
                    </div>

                    <div className="inline-gv-meter-gauge-wrap">
                      <div className="inline-gv-meter-gauge">
                        {(() => {
                          /* One rounded arc segment per verdict, each as long
                             as that verdict's share of the vote. The old
                             conic-gradient only knew three colours and sized
                             them from meterPercent, so the arc never matched
                             the breakdown printed underneath it. */
                          const ARC_LENGTH = Math.PI * GAUGE_RADIUS;
                          const SEGMENT_GAP = 3;
                          let travelled = 0;

                          return (
                            <svg
                              className="gv-gauge"
                              viewBox="0 0 200 112"
                              role="img"
                              aria-label={
                                totalVotes
                                  ? `${meterPercent}% positive from ${totalVotes} votes`
                                  : "No votes yet"
                              }
                            >
                              <path
                                className="gv-gauge-track"
                                d={GAUGE_PATH}
                              />
                              {METER_SEGMENTS.map((segment) => {
                                const share = totalVotes
                                  ? (reviewCounts[segment.key] || 0) /
                                    totalVotes
                                  : 0;
                                const offset = travelled;
                                travelled += share * ARC_LENGTH;
                                if (share <= 0) return null;

                                return (
                                  <path
                                    key={segment.key}
                                    className={`gv-gauge-segment ${segment.tone}`}
                                    d={GAUGE_PATH}
                                    strokeDasharray={`${Math.max(
                                      share * ARC_LENGTH - SEGMENT_GAP,
                                      1,
                                    )} ${ARC_LENGTH}`}
                                    strokeDashoffset={-offset}
                                  />
                                );
                              })}
                            </svg>
                          );
                        })()}

                        {/* The score takes the colour of the band it falls in,
                            so the headline agrees with the arc instead of
                            always reading green. */}
                        <div
                          className={`inline-gv-meter-inner ${
                            !totalVotes
                              ? ""
                              : meterPercent >= 60
                                ? "go"
                                : meterPercent >= 35
                                  ? "timepass"
                                  : "skip"
                          }`}
                        >
                          <strong>{animatedPercent}%</strong>
                          <span>
                            {totalVotes
                              ? `${top100FormatVotes(positiveVotes)}/${top100FormatVotes(totalVotes)} Votes`
                              : "No votes yet"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="inline-gv-meter-breakdown">
                      <div className="inline-gv-meter-legend skip">
                        <span className="inline-gv-meter-dot" />
                        <span>Skip</span>
                        <strong>
                          {totalVotes
                            ? Math.round((reviewCounts.skip / totalVotes) * 100)
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="inline-gv-meter-legend timepass">
                        <span className="inline-gv-meter-dot" />
                        <span>Timepass</span>
                        <strong>
                          {totalVotes
                            ? Math.round(
                                (reviewCounts.timepass / totalVotes) * 100,
                              )
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="inline-gv-meter-legend go">
                        <span className="inline-gv-meter-dot" />
                        <span>Go for it</span>
                        <strong>
                          {totalVotes
                            ? Math.round(
                                (reviewCounts["go-for-it"] / totalVotes) * 100,
                              )
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="inline-gv-meter-legend perfection">
                        <span className="inline-gv-meter-dot" />
                        <span>Perfection</span>
                        <strong>
                          {totalVotes
                            ? Math.round(
                                (reviewCounts.perfection / totalVotes) * 100,
                              )
                            : 0}
                          %
                        </strong>
                      </div>
                    </div>

                    <div className="inline-gv-meter-divider" />

                    <section className="inline-gv-review-section">
                      <div className="inline-gv-review-heading">
                        <div>
                          <span>COMMUNITY</span>
                          <h4>Write a Review</h4>
                        </div>
                      </div>

                      <div className="community-review-box inline-gv-review-box">
                        <div className="community-review-top">
                          <div className="community-user">
                            <div className="community-avatar">
                              {(
                                auth.currentUser?.displayName
                                  ?.trim()
                                  ?.charAt(0) ||
                                auth.currentUser?.email?.charAt(0) ||
                                "G"
                              ).toUpperCase()}
                            </div>
                            <div>
                              <strong>
                                {auth.currentUser?.displayName ||
                                  auth.currentUser?.email?.split("@")[0] ||
                                  "Gamer"}
                              </strong>
                              <span>Share your experience</span>
                            </div>
                          </div>

                          <div
                            className="community-verdict-toggle"
                            role="group"
                            aria-label="Choose verdict"
                          >
                            {reviewOptions.map((option) => (
                              <button
                                key={`inline-composer-${option.id}`}
                                type="button"
                                className={
                                  composerVerdict === option.id
                                    ? `active ${option.id}`
                                    : option.id
                                }
                                disabled={reviewLoading}
                                aria-pressed={composerVerdict === option.id}
                                onClick={() => setComposerVerdict(option.id)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          className="community-review-input"
                          value={reviewText}
                          onChange={(e) =>
                            setReviewText(e.target.value.slice(0, 1000))
                          }
                          placeholder="Write your review here..."
                          maxLength={1000}
                        />

                        <div className="community-review-footer">
                          <span>{reviewText.length}/1000</span>
                          {/* A verdict is enough to post; the written review
                              is optional, so this no longer waits for text. */}
                          <button
                            type="button"
                            onClick={postCommunityReview}
                            disabled={!composerVerdict || reviewLoading}
                          >
                            {reviewLoading ? "Posting..." : "Post"}
                          </button>
                        </div>
                      </div>

                      {reviewMessage && (
                        /* Failures were rendered in the accent colour, so a
                           rejected save looked like a confirmation. */
                        <div
                          className={`meter-message inline-gv-message ${
                            reviewMessage.startsWith("✓")
                              ? "is-success"
                              : "is-error"
                          }`}
                          role="status"
                        >
                          {reviewMessage}
                        </div>
                      )}

                      <div className="community-reviews-heading inline-gv-user-reviews-heading">
                        <h3>User Reviews</h3>
                        <span className="community-review-count">
                          {visibleCommunityReviews.length}
                        </span>
                      </div>

                      <div className="community-review-list">
                        {visibleCommunityReviews.length === 0 ? (
                          <div className="community-empty">
                            No reviews yet. Pick a verdict above to be the
                            first.
                          </div>
                        ) : (
                          visibleCommunityReviews.map((review) => (
                            <ReviewCard
                              key={review.id}
                              review={review}
                              liked={likedReviewIds.includes(review.id)}
                              currentUserId={auth.currentUser?.uid}
                              formatReviewAge={formatReviewAge}
                              onToggleLike={toggleReviewLike}
                              onDelete={deleteMyReview}
                              onPostComment={postReviewComment}
                              onDeleteComment={deleteReviewComment}
                            />
                          ))
                        )}
                      </div>
                    </section>
                  </section>
                  )}
                </>
              );
            })()}
          </section>
        </div>
      )}
    </>
  );
}
