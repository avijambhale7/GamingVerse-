/* =========================================================
   REMOTE POSTERS
   Games found through RAWG search (not bundled in assets) have
   no local artwork, so getGameImage can't match them. This hook
   fills those in from the Games page's shared RAWG poster cache,
   and looks up whatever is still missing.
========================================================= */
import { useEffect, useMemo, useState } from "react";
import {
  lookupMissingPosters,
  readPosterImageCache,
} from "../../games/utils/posterLookup.js";
import { normalizeCatalogueImageKey } from "../../games/utils/text.js";
import { getGameImage } from "./gameImages.js";

export default function useRemotePosters(gameNames) {
  const [found, setFound] = useState(() => readPosterImageCache());

  // Only names with no local artwork need a remote poster.
  const missingKey = useMemo(
    () =>
      [...new Set(gameNames.filter(Boolean))]
        .filter((name) => !getGameImage(name))
        .sort()
        .join("\n"),
    [gameNames],
  );

  useEffect(() => {
    if (!missingKey) return undefined;
    let cancelled = false;
    const games = missingKey.split("\n").map((name) => ({ name }));

    lookupMissingPosters(games, readPosterImageCache(), {
      isCancelled: () => cancelled,
      onBatchFound: (batch) => {
        if (!cancelled) setFound((previous) => ({ ...previous, ...batch }));
      },
    }).catch((error) => console.warn("Poster lookup failed:", error));

    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  return (gameName, savedImage = "") =>
    getGameImage(gameName) ||
    savedImage ||
    found[normalizeCatalogueImageKey(gameName)] ||
    "";
}
