/* =========================================================
   useEscapeKey
   Calls onEscape when the Esc key is pressed, while `active`.
   Used so every pop-up (trailer, game details, QR ticket,
   rate-visit, followers list, post menu) closes with Esc.
========================================================= */
import { useEffect, useRef } from "react";

export default function useEscapeKey(onEscape, active = true) {
  // Keep the latest callback without re-adding the listener each render.
  const handlerRef = useRef(onEscape);
  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") handlerRef.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
}
