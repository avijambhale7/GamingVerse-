/* =========================================================
   MARKETPLACE HEADER
   Standalone-page header with brand, nav and notifications.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import NotificationBell from "../../../components/NotificationBell.jsx";

export default function MarketHeader({
  embedded,
  navigate,
  navigateToCafe,
  navigateToGames,
  page,
  user,
  wishlist,
}) {
  const renderHeader = () => (
    <div className="market-header">
      <div>
        <span className="market-kicker">GAMINGVERSE MARKETPLACE</span>

        <h1>Gaming Marketplace</h1>

        <p>Buy games, CDs and computer & gaming accessories.</p>
      </div>

      <div className="market-nav">
        {!embedded && (
          <button
            type="button"
            onClick={() => navigateToGames()}
            title="Back to GamingVerse"
          >
            ← Games
          </button>
        )}
        <button
          className={page === "products" ? "active" : ""}
          onClick={() => navigate("products")}
        >
          🛍 Marketplace
        </button>

        <button
          className={page === "wishlist" ? "active" : ""}
          onClick={() => navigate("wishlist")}
        >
          ♡ Wishlist
          {wishlist.length > 0 && (
            <span className="count">{wishlist.length}</span>
          )}
        </button>

        <button
          className={page === "requests" ? "active" : ""}
          onClick={() => navigate("requests")}
        >
          📨 My Requests
        </button>

        <button
          className={page === "seller" ? "active" : ""}
          onClick={() => navigate("seller")}
        >
          🏪 Sell
        </button>

        {user && <NotificationBell path={`notifications/${user.uid}`} />}

        {!embedded && (
          <button
            type="button"
            onClick={() => navigateToCafe()}
            title="Open Gaming Café"
          >
            ☕ Café
          </button>
        )}
      </div>
    </div>
  );

  return renderHeader();
}
