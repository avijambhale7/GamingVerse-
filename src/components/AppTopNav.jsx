/* =========================================================
   APP TOP NAV
   The desktop counterpart to AppBottomNav — icon tabs, with the
   active tab's name shown beside its icon, the same
   on every page, so Profile no longer looks like a different
   app from Games/Marketplace/Café.
========================================================= */
import { useLocation, useNavigate } from "react-router-dom";
import GVIcon from "../pages/games/components/GVIcon.jsx";
import { NAV_TABS, getActiveNavKey } from "./navTabs.js";
import "./AppTopNav.css";

export default function AppTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = getActiveNavKey(location.pathname, location.search);

  return (
    <nav className="app-top-nav" aria-label="Primary">
      {NAV_TABS.map((tab) => (
        <button
          key={tab.key}
          className={`app-top-nav-link ${activeKey === tab.key ? "active" : ""}`}
          type="button"
          title={tab.label}
          aria-current={activeKey === tab.key ? "page" : undefined}
          onClick={() => navigate(tab.to)}
        >
          <GVIcon name={tab.icon} size={18} />
          <span className="app-top-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
