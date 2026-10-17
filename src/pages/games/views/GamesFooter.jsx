/* =========================================================
   GAMES FOOTER
   Rendered by ../../Games.jsx. Brand and a one-line about, quick
   links to every section (the same list as the top and bottom
   navs), Help & Support, and the copyright line.
========================================================= */
import { Link } from "react-router-dom";
import GVLogoMark from "../../../components/GVLogoMark.jsx";
import SupportLink from "../../../components/SupportLink.jsx";
import { NAV_TABS } from "../../../components/navTabs.js";

export default function GamesFooter() {
  return (
    <footer className="games-footer">
      <div className="footer-top">
        <div className="footer-about">
          <div className="footer-brand">
            <GVLogoMark className="footer-logo-mark" />
            <span className="footer-brand-name">
              Gaming<span>Verse</span>
            </span>
          </div>
          <p>
            Discover games, book gaming cafes, trade game gear and meet other
            players — all in one place.
          </p>
        </div>

        <nav className="footer-links" aria-label="Explore">
          <h4>Explore</h4>
          {NAV_TABS.map((tab) => (
            <Link key={tab.key} to={tab.to}>
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="footer-links">
          <h4>Help</h4>
          <SupportLink className="footer-support-link" />
          <Link to="/profile">My profile</Link>
        </div>
      </div>

      <p className="footer-copyright">© 2026 GamingVerse. All rights reserved.</p>
    </footer>
  );
}
