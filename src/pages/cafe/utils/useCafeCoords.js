/* =========================================================
   useCafeCoords
   { [cafeId]: {lat, lng} } for the given cafés. Map-link and
   cached coordinates are instant; the rest are looked up one at
   a time (OpenStreetMap asks for at most one request a second).
========================================================= */
import { useEffect, useMemo, useState } from "react";
import { cachedCoords, geocodeAddress } from "./geo.js";

export default function useCafeCoords(cafes, enabled = true) {
  const [found, setFound] = useState({});

  const known = useMemo(() => {
    const map = {};
    cafes.forEach((cafe) => {
      const coords = cachedCoords(cafe);
      if (coords) map[cafe.id] = coords;
    });
    return map;
  }, [cafes]);

  const missingKey = cafes
    .filter((cafe) => !known[cafe.id] && cafe.address?.trim())
    .map((cafe) => `${cafe.id}\u0001${cafe.address.trim()}`)
    .join("\u0002");

  useEffect(() => {
    if (!enabled || !missingKey) return undefined;
    let cancelled = false;
    (async () => {
      for (const entry of missingKey.split("\u0002")) {
        if (cancelled) return;
        const [id, address] = entry.split("\u0001");
        const coords = await geocodeAddress(address);
        if (cancelled) return;
        if (coords) setFound((previous) => ({ ...previous, [id]: coords }));
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missingKey, enabled]);

  return useMemo(() => ({ ...found, ...known }), [found, known]);
}
