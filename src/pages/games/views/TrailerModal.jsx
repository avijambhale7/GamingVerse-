/* =========================================================
   TRAILER PLAYER MODAL
   Rendered by ../../Games.jsx.
========================================================= */

import { extractYouTubeId, getGameMediaFallback, getVerifiedTrailerUrl, toYouTubeEmbedUrl } from "../utils/media.js";
import { getGameDetails } from "../utils/gameInfo.js";

export default function TrailerModal({
  closeTrailer,
  selectedGame,
  showTrailer,
}) {
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
                return selectedGame.trailerType === "video" && !youtubeId ? (
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
                  <div className="gv-trailer-empty">
                    <strong>Trailer not available in embedded playback.</strong>
                    <span>Use the YouTube button below to watch it.</span>
                  </div>
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
                onClick={() => {
                  const id = extractYouTubeId(selectedGame.trailerUrl || "");
                  if (id) {
                    window.open(
                      `https://www.youtube.com/watch?v=${id}`,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }
                }}
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
