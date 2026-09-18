/* =========================================================
   MARKETPLACE HEADER
   Standalone-page header with brand, nav and cart counters.
   Rendered by ../../Marketplace.jsx.
========================================================= */

export default function MarketHeader({
  cartCount,
  embedded,
  navigate,
  navigateToCafe,
  navigateToGames,
  page,
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
          className={page === "cart" ? "active" : ""}
          onClick={() => navigate("cart")}
        >
          🛒 Cart
          {cartCount > 0 && <span className="count">{cartCount}</span>}
        </button>

        <button
          className={page === "orders" ? "active" : ""}
          onClick={() => navigate("orders")}
        >
          📦 Orders
        </button>

        <button
          className={page === "seller" ? "active" : ""}
          onClick={() => navigate("seller")}
        >
          🏪 Sell
        </button>

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
