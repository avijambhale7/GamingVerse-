/* =========================================================
   PRODUCT CATALOGUE
   The shop, a single product's details, and the wishlist.
   They share the tabs, filters and product-card renderers.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import { ACCESSORY_CATEGORIES, MARKET_TABS } from "../data/catalog.js";
import { money } from "../utils/format.js";

export default function ProductCatalogue({
  openRequest,
  category,
  condition,
  filteredProducts,
  marketType,
  navigate,
  openProduct,
  page,
  platform,
  products,
  search,
  selectedProduct,
  setCategory,
  setCondition,
  setMarketType,
  setPlatform,
  setSearch,
  setSelectedProduct,
  setSortBy,
  sortBy,
  toggleWishlist,
  wishlist,
}) {
  const typeProducts = products.filter((product) =>
    marketType === "accessories"
      ? product.productType === "accessory"
      : product.productType !== "accessory",
  );
  const catalogueStats = {
    listings: typeProducts.length,
    inStock: typeProducts.filter((p) => Number(p.stock) > 0).length,
    sellers: new Set(typeProducts.map((p) => p.sellerId).filter(Boolean)).size,
  };
  const filtersActive =
    Boolean(search) ||
    platform !== "All" ||
    category !== "All" ||
    condition !== "All" ||
    sortBy !== "featured";
  const clearFilters = () => {
    setSearch("");
    setPlatform("All");
    setCategory("All");
    setCondition("All");
    setSortBy("featured");
  };

  const renderMarketTabs = () => (
    <div className="market-type-tabs">
      {MARKET_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={marketType === tab.id ? "active" : ""}
          onClick={() => {
            setMarketType(tab.id);
            setSearch("");
            setPlatform("All");
            setCategory("All");
            setCondition("All");
            setSortBy("featured");
            setSelectedProduct(null);
            navigate("products");
          }}
        >
          <span className="market-type-icon">{tab.icon}</span>
          <span>
            <strong>{tab.label}</strong>
            <small>{tab.subtitle}</small>
          </span>
        </button>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="market-filters">
      <label className="market-search">
        <span aria-hidden="true">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            marketType === "accessories"
              ? "Search mouse, keyboard, headset..."
              : "Search gaming CDs..."
          }
          aria-label="Search products"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </label>

      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {marketType === "accessories" ? (
          <>
            <option value="All">All Compatibility</option>
            <option value="PC">PC</option>
            <option value="Xbox">Xbox</option>
            <option value="PlayStation">PlayStation</option>
            <option value="Universal">Universal</option>
          </>
        ) : (
          <>
            <option value="All">All Platforms</option>
            <option value="PS5">PS5</option>
            <option value="PS4">PS4</option>
            <option value="Xbox">Xbox</option>
            <option value="PC">PC</option>
          </>
        )}
      </select>

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {marketType === "accessories" ? (
          ACCESSORY_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Categories" : item}
            </option>
          ))
        ) : (
          <>
            <option value="All">All Categories</option>
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="RPG">RPG</option>
            <option value="Racing">Racing</option>
            <option value="Sports">Sports</option>
          </>
        )}
      </select>

      <select value={condition} onChange={(e) => setCondition(e.target.value)}>
        <option value="All">All Conditions</option>
        <option value="New">New</option>
        <option value="Used">Used</option>
      </select>

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="featured">Featured</option>
        <option value="rating">Highest Rated</option>
        <option value="priceLow">Price Low → High</option>
        <option value="priceHigh">Price High → Low</option>
      </select>
    </div>
  );

  const renderProductCard = (product) => {
    const wished = wishlist.includes(product.id);

    // Gaming CDs read like box art, so they get the GamerX-style poster
    // treatment: the photo fills the card and the details sit on a
    // gradient scrim at the bottom, instead of a separate content panel.
    if (marketType === "games") {
      return (
        <article
          className="product-card product-card-poster"
          key={product.id}
          onClick={() => openProduct(product)}
        >
          <div className="poster-image">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement.classList.add(
                    "image-fallback-active",
                  );
                }}
              />
            ) : (
              <span>🎮</span>
            )}
          </div>
          <div className="poster-scrim" />

          <button
            className="wishlist-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
          >
            {wished ? "♥" : "♡"}
          </button>

          <div className="poster-content">
            <small>
              {product.platform} • ⭐ {Number(product.rating || 0).toFixed(1)}
            </small>
            <h3>{product.name}</h3>
            <div className="poster-bottom">
              <strong>{money(product.price)}</strong>
              <span className="poster-badge">
                {Number(product.stock) > 0
                  ? `${product.stock} available`
                  : "Out of stock"}
              </span>
            </div>
          </div>
        </article>
      );
    }

    const stock = Number(product.stock) || 0;
    const stockState = stock === 0 ? "out" : stock <= 5 ? "low" : "ok";

    return (
      <div
        className="product-card"
        key={product.id}
        onClick={() => openProduct(product)}
      >
        <div className="product-image">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.classList.add(
                  "image-fallback-active",
                );
              }}
            />
          ) : (
            <span>🎮</span>
          )}

          <button
            className={`wishlist-button${wished ? " is-wished" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            {wished ? "♥" : "♡"}
          </button>

          <span className="condition-badge">{product.condition}</span>
          <span className={`stock-badge is-${stockState}`}>
            {stockState === "out"
              ? "Out of stock"
              : stockState === "low"
                ? `Only ${stock} left`
                : "In stock"}
          </span>
        </div>

        <div className="product-content">
          <small>
            {product.platform} • {product.category}
          </small>

          <h3>{product.name}</h3>

          <div className="rating">
            ⭐ {Number(product.rating || 0).toFixed(1)}
          </div>

          <p>{product.description || "Gaming CD available on GamingVerse."}</p>

          <div className="product-seller">
            <span aria-hidden="true">
              {String(product.sellerName || "S").trim().charAt(0).toUpperCase()}
            </span>
            {product.sellerName || "GamingVerse Seller"}
          </div>

          <div className="product-bottom">
            <div>
              <strong>{money(product.price)}</strong>
              <small>{stock > 0 ? `${stock} available` : "Out of stock"}</small>
            </div>

            <button
              className="primary-btn"
              disabled={stock === 0}
              onClick={(e) => {
                e.stopPropagation();
                openRequest(product);
              }}
            >
              📨 Request
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProducts = () => (
    <>
      <section className="market-hero">
        <div>
          <span className="hero-badge">
            {marketType === "accessories"
              ? "COMPUTER & GAMING ACCESSORIES"
              : "VERIFIED GAMING MARKET"}
          </span>

          <h2>
            {marketType === "accessories" ? "Complete your" : "Build your"}
            <span>
              {marketType === "accessories"
                ? " gaming setup."
                : " gaming collection."}
            </span>
          </h2>

          <p>
            {marketType === "accessories"
              ? "Find gaming and computer accessories for a complete gaming setup."
              : "Discover original and pre-owned gaming CDs at GamingVerse."}
          </p>

          <div className="hero-perks">
            <span>🛡️ Admin-verified requests</span>
            <span>📞 Direct seller contact</span>
            <span>🤝 No online payment needed</span>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-floaters" aria-hidden="true">
            {(marketType === "accessories"
              ? ["🖱️", "⌨️", "🎧", "🕹️"]
              : ["🎮", "💿", "🏆", "👾"]
            ).map((icon) => (
              <span key={icon}>{icon}</span>
            ))}
          </div>
          <div className="hero-stats">
            <div>
              <strong>{catalogueStats.listings}</strong>
              <span>Listings</span>
            </div>
            <div>
              <strong>{catalogueStats.inStock}</strong>
              <span>In stock</span>
            </div>
            <div>
              <strong>{catalogueStats.sellers}</strong>
              <span>Sellers</span>
            </div>
          </div>
        </div>
      </section>

      {renderMarketTabs()}
      {renderFilters()}

      <div className="results-heading">
        <div>
          <h2>Items</h2>
          <p>
            <b>{filteredProducts.length}</b> result
            {filteredProducts.length === 1 ? "" : "s"}
          </p>
        </div>
        {filtersActive && (
          <button type="button" className="clear-filters" onClick={clearFilters}>
            ✕ Clear filters
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div>{marketType === "accessories" ? "🖱️" : "🎮"}</div>
          <h3>No products found</h3>
          <p>Try another search or filter.</p>
          {filtersActive && (
            <button type="button" className="primary-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(renderProductCard)}
        </div>
      )}
    </>
  );

  const renderDetails = () => {
    if (!selectedProduct) {
      return renderProducts();
    }

    const wished = wishlist.includes(selectedProduct.id);

    return (
      <section className="detail-page">
        <button className="back-btn" onClick={() => navigate("products")}>
          ← Back
        </button>

        <div className="detail-grid">
          <div className="detail-image">
            {selectedProduct.image ? (
              <img src={selectedProduct.image} alt={selectedProduct.name} />
            ) : (
              <span>🎮</span>
            )}
          </div>

          <div className="detail-info">
            <span className="hero-badge">{selectedProduct.condition}</span>

            <h2>{selectedProduct.name}</h2>

            <div className="detail-rating">
              ⭐ {Number(selectedProduct.rating || 0).toFixed(1)}
            </div>

            <div className="detail-price">{money(selectedProduct.price)}</div>

            <div className="info-grid">
              <div>
                <span>Platform</span>
                <strong>{selectedProduct.platform}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{selectedProduct.category}</strong>
              </div>

              <div>
                <span>Condition</span>
                <strong>{selectedProduct.condition}</strong>
              </div>

              <div>
                <span>Stock</span>
                <strong>{selectedProduct.stock}</strong>
              </div>
            </div>

            <div className="detail-seller">
              <span aria-hidden="true">🏪</span>
              <div>
                <small>Sold by</small>
                <strong>{selectedProduct.sellerName || "GamingVerse Seller"}</strong>
              </div>
            </div>

            <p className="detail-request-hint">
              Send a request → the admin approves it → the seller accepts →
              you both get each other&apos;s mobile number to finish the deal.
            </p>

            <h3>Description</h3>

            <p className="detail-description">
              {selectedProduct.description ||
                "Original gaming CD available on GamingVerse."}
            </p>

            <div className="detail-actions">
              <button
                className="secondary-btn"
                onClick={() => toggleWishlist(selectedProduct)}
              >
                {wished ? "♥ Saved" : "♡ Wishlist"}
              </button>

              <button
                className="primary-btn large"
                disabled={Number(selectedProduct.stock || 0) <= 0}
                onClick={() => openRequest(selectedProduct)}
              >
                {Number(selectedProduct.stock || 0) <= 0
                  ? "Out of stock"
                  : "📨 Request to Buy"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderWishlist = () => {
    const saved = products.filter((product) => wishlist.includes(product.id));

    return (
      <section className="section-page">
        <button className="back-btn" onClick={() => navigate("products")}>
          ← Marketplace
        </button>

        <h2>My Wishlist</h2>

        {saved.length === 0 ? (
          <div className="empty-state">
            <div>♡</div>
            <h3>Wishlist is empty</h3>
            <button
              className="primary-btn"
              onClick={() => navigate("products")}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="products-grid">{saved.map(renderProductCard)}</div>
        )}
      </section>
    );
  };

  return (
    <>
      {page === "products" && renderProducts()}

      {page === "details" && renderDetails()}

      {page === "wishlist" && renderWishlist()}
    </>
  );
}
