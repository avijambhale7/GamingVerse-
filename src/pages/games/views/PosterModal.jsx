/* =========================================================
   POSTER PREVIEW MODAL
   Rendered by ../../Games.jsx.
========================================================= */

import { getGameDetails } from "../utils/gameInfo.js";
import { getGameMediaFallback } from "../utils/media.js";

export default function PosterModal({
  closePoster,
  selectedGame,
  showPoster,
}) {
  return (
    <>
      {showPoster && selectedGame && (
        <div
          className="gv-poster-backdrop"
          onClick={closePoster}
          role="dialog"
          aria-modal="true"
          aria-label={`${getGameDetails(selectedGame.name).title} poster`}
        >
          <button
            className="gv-poster-close"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closePoster();
            }}
            aria-label="Close poster"
          >
            ×
          </button>
          <div
            className="gv-poster-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={
                selectedGame.image ||
                getGameMediaFallback(selectedGame.name)?.poster ||
                ""
              }
              alt={selectedGame.name}
              className="gv-poster-image"
              onError={(event) => {
                const fallbackPoster = getGameMediaFallback(
                  selectedGame.name,
                )?.poster;
                if (
                  fallbackPoster &&
                  event.currentTarget.src !== fallbackPoster
                ) {
                  event.currentTarget.src = fallbackPoster;
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
