/* =========================================================
   GAMES NAVBAR
   Brand, icon navigation, live search, notifications and profile menu.
   Rendered by ../../Games.jsx.
========================================================= */

import GVIcon from "../components/GVIcon.jsx";
import { formatActivityDate } from "../utils/text.js";
import { getGameDetails } from "../utils/gameInfo.js";
import AppTopNav from "../../../components/AppTopNav.jsx";
import AppBottomNav from "../../../components/AppBottomNav.jsx";

export default function GamesNavbar({
  focusSearch,
  navigate,
  notificationTab,
  notifications,
  openDetails,
  profileMenuRef,
  search,
  searchInputRef,
  searchResults,
  setActiveCategory,
  setActiveView,
  setNotificationTab,
  setNotifications,
  setSearch,
  setShowNotifications,
  showNotifications,
}) {
  return (
    <>
      <header className="games-navbar">
        <button
          className="brand brand-home-button"
          type="button"
          title="GamingVerse Home"
          aria-label="GamingVerse Home"
          style={{
            border: "none",
            outline: "none",
            padding: 0,
            margin: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            textAlign: "left",
            cursor: "pointer",
          }}
          onClick={() => {
            setActiveView("home");
            setActiveCategory("All");
            setSearch("");
            setShowNotifications(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-icon" aria-hidden="true">
            🎮
          </span>

          <span className="brand-text">
            <h2>
              Gaming<span>Verse</span>
            </h2>

            <small>Level up your gaming experience</small>
          </span>
        </button>

        <div className="games-navbar-right-group">
          <AppTopNav />

          <div className="navbar-right">
          <div className="search-box">
            <button
              type="button"
              className="search-icon-button"
              onClick={focusSearch}
              aria-label="Focus search"
              title="Search games"
            >
              <GVIcon name="search" size={18} />
            </button>

            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchResults.length > 0) {
                    setSearch("");
                    setActiveView("home");
                    openDetails(searchResults[0]);
                  } else {
                    document.querySelector(".games-content")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }

                if (e.key === "Escape") {
                  setSearch("");
                  e.currentTarget.blur();
                }
              }}
              aria-label="Search games"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setSearch("");
                  focusSearch();
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {search.trim() && (
            <div className="search-results-dropdown">
              <div className="search-results-header">
                <span>SEARCH RESULTS</span>
                <strong>{searchResults.length}</strong>
              </div>

              {searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.slice(0, 8).map((game) => (
                    <button
                      key={`search-${game.name}`}
                      type="button"
                      className="search-result-item"
                      onClick={() => {
                        setSearch("");
                        setActiveView("home");
                        openDetails(game);
                      }}
                    >
                      <img src={game.image} alt={game.name} />
                      <span>
                        <strong>{game.name}</strong>
                        <small>
                          {getGameDetails(game.name).genre || "Game"}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  <span>🎮</span>
                  <strong>No games found</strong>
                  <small>Try a different game name.</small>
                </div>
              )}
            </div>
          )}

          <div className="navbar-profile-layer" ref={profileMenuRef}>
            <div className="navbar-icon-actions">
              <button
                type="button"
                className={`navbar-icon-button ${showNotifications ? "active" : ""}`}
                onClick={() => {
                  setShowNotifications((current) => !current);
                }}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <span className="navbar-icon">
                  <GVIcon name="bell" size={19} />
                </span>
                <span className="notification-dot" aria-hidden="true"></span>
              </button>

              <button
                type="button"
                className="navbar-icon-button navbar-profile-desktop-only"
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/profile");
                }}
                aria-label="Open profile"
                title="Profile"
              >
                <span className="profile-avatar profile-avatar-button">
                  <GVIcon name="user" size={20} />
                </span>
              </button>
            </div>

            {showNotifications && (
              <div className="navbar-popover notifications-popover">
                <div className="popover-header">
                  <h3>Notifications</h3>
                  <button
                    type="button"
                    className="popover-header-action"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    ×
                  </button>
                </div>

                <div className="notification-tabs">
                  <button
                    type="button"
                    className={notificationTab === "all" ? "active" : ""}
                    onClick={() => setNotificationTab("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={notificationTab === "updates" ? "active" : ""}
                    onClick={() => setNotificationTab("updates")}
                  >
                    Updates
                  </button>
                  <button
                    type="button"
                    className={notificationTab === "activity" ? "active" : ""}
                    onClick={() => setNotificationTab("activity")}
                  >
                    Activity
                  </button>
                </div>

                <div className="notification-body">
                  {(() => {
                    const visibleNotifications = notifications.filter((item) =>
                      notificationTab === "all"
                        ? true
                        : notificationTab === "updates"
                          ? item.type === "update"
                          : item.type === "activity",
                    );

                    return visibleNotifications.length ? (
                      <>
                        <div className="notification-period">Last 30 Days</div>
                        {visibleNotifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`notification-item ${item.read ? "is-read" : ""}`}
                            onClick={() => {
                              const next = notifications.map((notification) =>
                                notification.id === item.id
                                  ? { ...notification, read: true }
                                  : notification,
                              );
                              setNotifications(next);
                              localStorage.setItem(
                                "gamingverse_notifications",
                                JSON.stringify(next),
                              );
                            }}
                          >
                            <div
                              className={`notification-avatar ${item.type === "update" ? "purple" : ""}`}
                            >
                              {item.type === "update" ? "★" : "G"}
                            </div>
                            <div className="notification-copy">
                              <strong>{item.title}</strong>
                              <p>{item.message}</p>
                              <span>{formatActivityDate(item.createdAt)}</span>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="notification-empty-state">
                        <span>{notificationTab === "updates" ? "✦" : "◌"}</span>
                        <strong>
                          {notificationTab === "updates"
                            ? "No new updates"
                            : "No recent activity"}
                        </strong>
                        <p>
                          {notificationTab === "updates"
                            ? "You are all caught up."
                            : "Your latest GamingVerse activity will appear here."}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="notification-footer">
                  Notifications are automatically removed after 30 days
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* Mobile-only floating bottom tab bar — the horizontal scroll-row
          inside the header works, but reaching it means scrolling back
          up first. A fixed bottom bar keeps navigation one thumb-tap
          away, matching how native apps place primary navigation.
          Shared with Profile so every page has the same one. */}
      <AppBottomNav />
    </>
  );
}
