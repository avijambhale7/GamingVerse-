/* =========================================================
   GAMES NAVBAR
   Brand, icon navigation, live search, notifications and profile menu.
   Rendered by ../../Games.jsx.
========================================================= */

import GVIcon from "../components/GVIcon.jsx";
import { formatActivityDate } from "../utils/text.js";
import { getGameDetails } from "../utils/gameInfo.js";

export default function GamesNavbar({
  activeCategory,
  activeView,
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
  setSpacesSection,
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

        <nav className="games-main-nav">
          <button
            className={`nav-icon-link ${
              activeView === "home" && activeCategory === "All" ? "active" : ""
            }`}
            title="Home"
            aria-label="Home"
            onClick={() => {
              setActiveView("home");
              setActiveCategory("All");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="home-navbar-icon" aria-hidden="true">
              ⌂
            </span>
            <span className="nav-icon-label">Home</span>
          </button>

          <button
            className={`nav-icon-link ${
              activeView === "upcomings" ? "active" : ""
            }`}
            title="Upcomings"
            aria-label="Upcomings"
            onClick={() => {
              setActiveView("upcomings");
              setActiveCategory("All");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <GVIcon name="calendar" />
            <span className="nav-icon-label">Upcomings</span>
          </button>

          <button
            className={`nav-icon-link ${
              activeView === "trailers" ? "active" : ""
            }`}
            title="Spaces"
            aria-label="Spaces"
            onClick={() => {
              setActiveView("trailers");
              setSpacesSection("feed");
            }}
          >
            <GVIcon name="spaces" />
            <span className="nav-icon-label">Spaces</span>
          </button>

          {/* CD MARKETPLACE */}
          <button
            className={`nav-icon-link marketplace-nav-button ${
              activeView === "marketplace" ? "active" : ""
            }`}
            type="button"
            title="Marketplace • Games, CDs & Accessories"
            aria-label="CD Marketplace"
            onClick={() => {
              setActiveView("marketplace");
              setActiveCategory("All");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <GVIcon name="cart" />
            <span className="nav-icon-label">Marketplace</span>
          </button>

          {/* GAMING CAFÉ BOOKING */}
          <button
            className={`nav-icon-link cafe-nav-button ${
              activeView === "cafe" ? "active" : ""
            }`}
            type="button"
            title="Café • Book a Gaming Session"
            aria-label="Gaming Café Booking"
            onClick={() => {
              setActiveView("cafe");
              setActiveCategory("All");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="cafe-navbar-icon" aria-hidden="true">
              🎮
            </span>
            <span className="nav-icon-label">Café</span>
          </button>
        </nav>

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
                className="navbar-icon-button"
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
      </header>
    </>
  );
}
