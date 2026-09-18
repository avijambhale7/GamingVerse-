/* =========================================================
   PRODUCT CATALOGUE
   The shop, a single product's details, and the wishlist.
   They share the tabs, filters and product-card renderers.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import { ACCESSORY_CATEGORIES, MARKET_TABS } from "../data/catalog.js";
import { getOnlineSearchUrl, money } from "../utils/format.js";

export default function ProductCatalogue({
  addToCart,
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
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          marketType === "accessories"
            ? "Search mouse, keyboard, headset..."
            : "Search gaming CDs..."
        }
      />

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

    return (
      <div className="product-card" key={product.id}>
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
            className="wishlist-button"
            onClick={() => toggleWishlist(product)}
          >
            {wished ? "♥" : "♡"}
          </button>

          <span className="condition-badge">{product.condition}</span>
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

          <div className="product-bottom">
            <div>
              <strong>{money(product.price)}</strong>

              <small>
                {Number(product.stock) > 0
                  ? `${product.stock} available`
                  : "Out of stock"}
              </small>
            </div>

            <button
              className="primary-btn"
              onClick={() => openProduct(product)}
            >
              View Details
            </button>

            {product.productType === "accessory" && (
              <div className="online-shopping-links">
                <a
                  href={getOnlineSearchUrl("Amazon", product.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="amazon-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  🛒 Amazon
                </a>
                <a
                  href={getOnlineSearchUrl("Flipkart", product.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="flipkart-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  🛍 Flipkart
                </a>
              </div>
            )}
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
        </div>

        <div className="hero-stat">
          <strong>{filteredProducts.length}</strong>

          <span>
            {marketType === "accessories" ? "Accessories" : "Products"}
          </span>
        </div>
      </section>

      {renderMarketTabs()}
      {renderFilters()}

      <div className="results-heading">
        <div>
          <h2>
            {marketType === "accessories"
              ? "Computer & Gaming Accessories"
              : "Gaming CDs"}
          </h2>
          <p>{filteredProducts.length} result(s)</p>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div>{marketType === "accessories" ? "🖱️" : "🎮"}</div>
          <h3>No products found</h3>
          <p>Try another search or filter.</p>
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
                className="secondary-btn"
                onClick={() => addToCart(selectedProduct)}
              >
                🛒 Add to Cart
              </button>

              <button
                className="primary-btn large"
                disabled={Number(selectedProduct.stock || 0) <= 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  navigate("checkout");
                }}
              >
                Buy Now
              </button>
            </div>

            {selectedProduct.productType === "accessory" && (
              <div className="detail-shopping-links">
                <a
                  href={getOnlineSearchUrl("Amazon", selectedProduct.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  🛒 Shop on Amazon
                </a>
                <a
                  href={getOnlineSearchUrl("Flipkart", selectedProduct.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  🛍 Shop on Flipkart
                </a>
              </div>
            )}
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
