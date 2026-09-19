/* =========================================================
   APP BOTTOM NAV
   Floating mobile tab bar, route-driven so every page (Games,
   Profile, ...) can render the exact same navigation instead
   of each page needing its own. Games.jsx reads the same
   ?view= query param on mount, so tapping a tab here lands on
   the right section.
========================================================= */
import { useLocation, useNavigate } from "react-router-dom";
import GVIcon from "../pages/games/components/GVIcon.jsx";
import { NAV_TABS, getActiveNavKey } from "./navTabs.js";
import "./AppBottomNav.css";

export default function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = getActiveNavKey(location.pathname, location.search);

  return (
    <nav className="games-bottom-tabbar" aria-label="Primary">
      {NAV_TABS.map((tab) => (
        <button
          key={tab.key}
          className={`bottom-tab-link ${activeKey === tab.key ? "active" : ""}`}
          type="button"
          title={tab.label}
          aria-label={tab.label}
          onClick={() => navigate(tab.to)}
        >
          <span className="bottom-tab-icon">
            <GVIcon name={tab.icon} size={21} />
          </span>
          <span className="bottom-tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
