/* =========================================================
   PAGE TITLE
   Names the browser tab after the current page ("Café ·
   GamingVerse") so tabs, history and bookmarks are clear.
   Rendered once inside the router in App.jsx.
========================================================= */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GAMES_VIEWS = {
  spaces: "Spaces",
  clubs: "Gaming Clubs",
  upcomings: "Upcoming Games",
  marketplace: "Shop",
  cafe: "Cafés",
};

const PAGES = {
  "/login": "Sign in",
  "/cafe": "Cafés",
  "/marketplace": "Shop",
  "/owner-dashboard": "Owner Dashboard",
  "/admin": "Admin",
  "/profile": "Profile",
};

export default function PageTitle() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    let page = PAGES[pathname] || "";
    if (pathname.startsWith("/games")) {
      const view = new URLSearchParams(search).get("view");
      page = GAMES_VIEWS[view] || "";
    }
    document.title = page ? `${page} · GamingVerse` : "GamingVerse";
  }, [pathname, search]);

  return null;
}
