/* =========================================================
   GAMINGVERSE LOGO MARK
   The brand icon: a bold outline controller with an orbit ring
   on the pink → violet → indigo app tile. The same drawing is
   public/favicon.svg, so the site and the browser tab match.
   Size it with CSS (it fills its container).
========================================================= */
import { useId } from "react";
import "./GVLogoMark.css";

export default function GVLogoMark({ className = "" }) {
  // Unique gradient id, so several logos on one page don't clash.
  const gradientId = `gv-logo-${useId().replace(/:/g, "")}`;

  return (
    <svg
      className={`gv-logo-mark ${className}`.trim()}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ec4899" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="112" height="112" rx="30" fill={`url(#${gradientId})`} />
      <g transform="translate(60 62) scale(0.82) translate(-60 -62)">
        <ellipse
          cx="60"
          cy="62"
          rx="56"
          ry="17"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.45"
          strokeWidth="6"
          transform="rotate(-18 60 62)"
        />
        <path
          d="M38 42H82A16 16 0 0 1 97 54L102 76A9 9 0 0 1 87 84L79 76H41L33 84A9 9 0 0 1 18 76L23 54A16 16 0 0 1 38 42Z"
          fill="none"
          stroke="#fff"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <rect x="31" y="55.5" width="18" height="6" rx="2" fill="#fff" />
        <rect x="37" y="49.5" width="6" height="18" rx="2" fill="#fff" />
        <circle cx="80" cy="53" r="4.2" fill="#fff" />
        <circle cx="88" cy="60" r="4.2" fill="#fff" />
        <circle cx="80" cy="67" r="4.2" fill="#fff" />
        <circle cx="72" cy="60" r="4.2" fill="#fff" />
        <path
          d="M6.7 79.3A56 17 -18 0 0 113.3 44.7"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="108" cy="36" r="6" fill="#fff" />
      </g>
    </svg>
  );
}
