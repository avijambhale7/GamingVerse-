/* =========================================================
   GVICON
   The outlined icon set used by the games navbar and menus.
========================================================= */

export function GVIcon({ name, size = 21 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 5-4.8 2.2 2.2-4.8 5-2.4Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2.2" />
        <path d="M16 2.8v3.6M8 2.8v3.6M3 9h18" />
      </>
    ),
    spaces: (
      <>
        <path d="M7 6h10v8H7z" />
        <path d="M9 14v3M15 14v3M6 17h12" />
        <path d="M9 4V2M15 4V2" />
      </>
    ),
    bookmark: (
      <>
        <path d="M6 3.5h12v17l-6-3.7-6 3.7z" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 8H7" />
        <circle cx="10" cy="19" r="1.4" />
        <circle cx="18" cy="19" r="1.4" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    bell: (
      <>
        <path d="M6.5 10.5a5.5 5.5 0 1 1 11 0c0 5 2 5.5 2 7H4.5c0-1.5 2-2 2-7Z" />
        <path d="M10 20h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.2" />
        <path d="m15.5 15.5 4.2 4.2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.8-3.4 3-5.2 6.5-5.2s5.7 1.8 6.5 5.2" />
      </>
    ),
    home: (
      <>
        <path d="m4 11 8-7 8 7" />
        <path d="M6 9.5V20h12V9.5" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
    coffee: (
      <>
        <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
        <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M8 5v1.6M11 5v1.6M14 5v1.6" />
      </>
    ),
    gamepad: (
      <>
        <path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4a4 4 0 0 0-4-3.6Z" />
        <path d="M6 11h4M8 9v4" />
        <path d="M15 12h.01M18 10h.01" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default GVIcon;
