/* =========================================================
   TRAILER PLAYER MODAL
   Rendered by ../../Games.jsx.
========================================================= */

import {
  extractYouTubeId,
  getGameMediaFallback,
  getVerifiedTrailerUrl,
  toYouTubeEmbedUrl,
} from "../utils/media.js";
import { getGameDetails } from "../utils/gameInfo.js";
import useEscapeKey from "../../../utils/useEscapeKey.js";

export default function TrailerModal({
  closeTrailer,
  selectedGame,
  showTrailer,
}) {
  useEscapeKey(closeTrailer, Boolean(showTrailer && selectedGame));
  // With no known video, open a YouTube search instead of doing nothing.
  const openOnYouTube = () => {
    const id = extractYouTubeId(selectedGame?.trailerUrl || "");
    const url = id
      ? `https://www.youtube.com/watch?v=${id}`
      : selectedGame?.trailerSearchUrl ||
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${getGameDetails(selectedGame?.name).title} official trailer`,
        )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Not-found screen over the game's blurred artwork.
  const renderMissing = () => {
    const poster = selectedGame.trailerPreview || selectedGame.image || "";
    const title = getGameDetails(selectedGame.name).title;
    return (
      <div className="gv-trailer-state" role="status">
        {poster && <img className="gv-trailer-state-bg" src={poster} alt="" />}
        <div className="gv-trailer-state-card">
          <span className="gv-trailer-state-icon" aria-hidden="true">
            🎬
          </span>
          <strong>No trailer found</strong>
          <small>{`We couldn't find a playable trailer for ${title}.`}</small>
          <button type="button" onClick={openOnYouTube}>
            ▶ Search on YouTube
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {showTrailer && selectedGame && (
        <div className="gv-trailer-backdrop" onClick={closeTrailer}>
          <section
            className="gv-trailer-modal"
            onClick={(event) => event.stopPropagation()}
            aria-label={`${getGameDetails(selectedGame.name).title} trailer`}
          >
            <header className="gv-trailer-header">
              <div className="gv-trailer-heading">
                <span className="gv-trailer-eyebrow">GAMINGVERSE TRAILER</span>
                <h2>{getGameDetails(selectedGame.name).title}</h2>
                <span>Watch the trailer without leaving GamingVerse.</span>
              </div>
              <button
                className="gv-trailer-close"
                type="button"
                onClick={closeTrailer}
                aria-label="Close trailer"
              >
                ×
              </button>
            </header>

            <div className="gv-trailer-player-shell">
              {(() => {
                const gameName = String(selectedGame.name || "").trim();
                const fallbackTrailer =
                  getVerifiedTrailerUrl(gameName) ||
                  getGameDetails(gameName)?.trailerUrl ||
                  getGameMediaFallback(gameName)?.trailer ||
                  "";
                const trailerUrl = String(
                  selectedGame.trailerUrl || fallbackTrailer,
                ).trim();
                const youtubeId = extractYouTubeId(trailerUrl);
                const embedUrl = youtubeId
                  ? toYouTubeEmbedUrl(trailerUrl)
                  : trailerUrl;
                // While the trailer is still loading, keep the player
                // plain black (no spinner or message).
                return selectedGame.trailerType === "searching" ? (
                  <div
                    className="gv-trailer-black"
                    aria-label="Loading trailer"
                  />
                ) : selectedGame.trailerType === "video" && !youtubeId ? (
                  <video
                    className="gv-trailer-player"
                    src={embedUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                  />
                ) : embedUrl ? (
                  <iframe
                    key={embedUrl}
                    className="gv-trailer-player"
                    src={embedUrl}
                    title={`${getGameDetails(selectedGame.name).title} official trailer`}
                    allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  renderMissing()
                );
              })()}
            </div>

            <div className="gv-trailer-footer">
              <div className="gv-trailer-footer-title">
                <strong>{getGameDetails(selectedGame.name).title}</strong>
                <span>Official Trailer</span>
              </div>
              <button
                type="button"
                className="gv-trailer-youtube-link"
                onClick={openOnYouTube}
              >
                ▶ YouTube
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
