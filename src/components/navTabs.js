/* =========================================================
   PRIMARY NAV TABS
   Single source of truth for GamingVerse's main sections, so
   AppTopNav (desktop) and AppBottomNav (mobile) always offer
   the exact same destinations and highlight the same tab.

   Profile isn't listed here on purpose — the header has its own
   profile avatar button (right of the notification bell) on every
   screen size, so repeating it in this row would be a duplicate.
========================================================= */
export const NAV_TABS = [
  { key: "home", label: "Home", icon: "home", to: "/games" },
  {
    key: "upcomings",
    label: "Upcoming",
    icon: "calendar",
    to: "/games?view=upcomings",
  },
  { key: "spaces", label: "Spaces", icon: "spaces", to: "/games?view=spaces" },
  { key: "shop", label: "Shop", icon: "cart", to: "/games?view=marketplace" },
  { key: "cafe", label: "Café", icon: "coffee", to: "/games?view=cafe" },
];

export function getActiveNavKey(pathname, search) {
  if (pathname.startsWith("/profile")) return "profile";
  if (!pathname.startsWith("/games")) return "";

  const view = new URLSearchParams(search).get("view");
  if (view === "upcomings") return "upcomings";
  if (view === "spaces" || view === "clubs") return "spaces";
  if (view === "marketplace") return "shop";
  if (view === "cafe") return "cafe";
  return "home";
}
