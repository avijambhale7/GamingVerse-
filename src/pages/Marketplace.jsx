import { useEffect, useMemo, useState } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  get,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
} from "firebase/database";

import { auth, db } from "../firebase";
import PageSkeleton from "../components/PageSkeleton.jsx";
import "./Marketplace.css";

import {
  EMPTY_PRODUCT,
} from "./marketplace/data/catalog.js";

import MarketHeader from "./marketplace/views/MarketHeader.jsx";
import RequestModal from "./marketplace/views/RequestModal.jsx";
import RequestsView from "./marketplace/views/RequestsView.jsx";
import ProductCatalogue from "./marketplace/views/ProductCatalogue.jsx";
import SellerView from "./marketplace/views/SellerView.jsx";

export default function Marketplace({ embedded = false }) {
  const routeNavigate = useRouterNavigate();
  const navigateToGames = () => routeNavigate("/games");
  const navigateToCafe = () => routeNavigate("/cafe");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  // Product the buyer is about to request (opens the request modal).
  const [requestProduct, setRequestProduct] = useState(null);

  const [page, setPage] = useState("products");
  const [marketType, setMarketType] = useState("accessories");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  const [toast, setToast] = useState("");


  const [sellerForm, setSellerForm] = useState(EMPTY_PRODUCT);

  const [editingId, setEditingId] = useState(null);

  const notify = (text) => {
    setToast(text);

    clearTimeout(window.marketToastTimer);

    window.marketToastTimer = setTimeout(() => {
      setToast("");
    }, 2500);
  };

  // Keep Marketplace product listings live. The `products` node is the only
  // source of truth now — every listing here was added by a real seller
  // through the Sell tab (or an owner's accessory form), so what buyers see
  // is exactly what people are actually offering, never seed/demo data.
  useEffect(() => {
    const productsRef = ref(db, "products");
    const unsubscribeProducts = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const firebaseProducts = Object.entries(data)
          .filter(([, product]) => product && typeof product === "object")
          .map(([id, product]) => ({
            id,
            ...product,
            productType: product.productType || "game",
          }))
          .filter((product) => product.status !== "blocked");

        setProducts(firebaseProducts);
      },
      (error) => {
        console.error("Marketplace product listener error:", error);
        notify("Could not load marketplace listings.");
      },
    );

    return () => unsubscribeProducts();
  }, []);

  const navigate = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const loadData = async (currentUser) => {
    setLoading(true);

    try {
      // Product inventory is maintained by the realtime `products` listener
      // above; this only loads the signed-in user's wishlist.
      if (!currentUser) {
        setWishlist([]);
        return;
      }

      const wishlistSnap = await get(ref(db, `wishlists/${currentUser.uid}`));
      setWishlist(wishlistSnap.exists() ? Object.keys(wishlistSnap.val()) : []);
    } catch (error) {
      console.error("Marketplace load error:", error);
      if (currentUser) setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await loadData(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) =>
      marketType === "accessories"
        ? product.productType === "accessory"
        : product.productType !== "accessory",
    );

    const text = search.trim().toLowerCase();

    if (text) {
      result = result.filter((product) =>
        [
          product.name,
          product.platform,
          product.category,
          product.condition,
          product.sellerName,
          product.accessoryType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text)),
      );
    }

    if (platform !== "All") {
      result = result.filter((product) => product.platform === platform);
    }

    if (category !== "All") {
      result = result.filter(
        (product) =>
          product.category === category || product.accessoryType === category,
      );
    }

    if (condition !== "All") {
      result = result.filter((product) => product.condition === condition);
    }

    if (sortBy === "priceLow") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortBy === "priceHigh") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sortBy === "rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return result;
  }, [products, marketType, search, platform, category, condition, sortBy]);


  const requireLogin = () => {
    if (!user) {
      notify("Please login first.");
      return false;
    }

    return true;
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    navigate("details");
  };

  const toggleWishlist = async (product) => {
    if (!requireLogin()) return;

    try {
      const exists = wishlist.includes(product.id);

      if (exists) {
        await remove(ref(db, `wishlists/${user.uid}/${product.id}`));

        setWishlist((prev) => prev.filter((id) => id !== product.id));

        notify("Removed from wishlist.");
      } else {
        await set(ref(db, `wishlists/${user.uid}/${product.id}`), true);

        setWishlist((prev) => [...prev, product.id]);

        notify("Added to wishlist.");
      }
    } catch (error) {
      console.error(error);
      notify("Wishlist update failed.");
    }
  };

  const openRequest = (product) => {
    if (!requireLogin()) return;

    if (product.sellerId === user.uid) {
      notify("This is your own listing.");
      return;
    }

    if (Number(product.stock || 0) <= 0) {
      notify("Product is out of stock.");
      return;
    }

    setRequestProduct(product);
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!requireLogin()) return;

    if (!sellerForm.name.trim() || !sellerForm.price || !sellerForm.stock) {
      notify("Fill all required product fields.");
      return;
    }

    try {
      const productData = {
        name: sellerForm.name.trim(),

        platform: sellerForm.platform,

        category: sellerForm.category,

        condition: sellerForm.condition,

        price: Number(sellerForm.price),

        stock: Number(sellerForm.stock),

        image: sellerForm.image.trim(),

        description: sellerForm.description.trim(),

        sellerId: user.uid,

        sellerName:
          user.displayName || user.email?.split("@")[0] || "GamingVerse Seller",

        rating: 0,
        status: "active",
        updatedAt: Date.now(),
      };

      if (editingId) {
        await update(ref(db, `products/${editingId}`), productData);

        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingId
              ? {
                  ...product,
                  ...productData,
                }
              : product,
          ),
        );

        notify("Product updated.");
      } else {
        const newRef = push(ref(db, "products"));

        const newProduct = {
          ...productData,
          createdAt: Date.now(),
        };

        await set(newRef, newProduct);

        setProducts((prev) => [
          {
            id: newRef.key,
            ...newProduct,
          },
          ...prev,
        ]);

        notify("Product added.");
      }

      setSellerForm(EMPTY_PRODUCT);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      notify("Could not save product.");
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);

    setSellerForm({
      name: product.name || "",
      platform: product.platform || "PS5",
      category: product.category || "Action",
      condition: product.condition || "New",
      price: product.price || "",
      stock: product.stock || "",
      image: product.image || "",
      description: product.description || "",
    });

    navigate("seller");
  };

  const deleteProduct = async (product) => {
    if (!user) return;

    if (product.sellerId !== user.uid) {
      notify("You can only delete your own products.");
      return;
    }

    if (!window.confirm(`Delete ${product.name}?`)) {
      return;
    }

    try {
      await remove(ref(db, `products/${product.id}`));

      setProducts((prev) => prev.filter((item) => item.id !== product.id));

      notify("Product deleted.");
    } catch (error) {
      console.error(error);
      notify("Could not delete product.");
    }
  };



  if (loading) {
    return <PageSkeleton variant="grid" />;
  }

  return (
    <div
      className={`gamingverse-marketplace ${embedded ? "marketplace-embedded" : ""}`}
    >
      {toast && <div className="market-toast">{toast}</div>}

      {!embedded && (
        <MarketHeader
          embedded={embedded}
          navigate={navigate}
          navigateToCafe={navigateToCafe}
          navigateToGames={navigateToGames}
          page={page}
          user={user}
          wishlist={wishlist}
        />
      )}

      {embedded && (
        <div className="market-embedded-toolbar">
          <div>
            <span className="market-kicker">GAMINGVERSE MARKETPLACE</span>
            <strong>Games, CDs & Accessories</strong>
          </div>
          <div className="market-embedded-actions">
            <button
              type="button"
              className={page === "products" ? "active" : ""}
              onClick={() => navigate("products")}
            >
              <span className="mtab-icon" aria-hidden="true">🛍</span>
              <span className="mtab-label">Shop</span>
            </button>
            <button
              type="button"
              className={page === "wishlist" ? "active" : ""}
              onClick={() => navigate("wishlist")}
            >
              <span className="mtab-icon" aria-hidden="true">♡</span>
              <span className="mtab-label">
                Wishlist{wishlist.length ? ` (${wishlist.length})` : ""}
              </span>
            </button>
            <button
              type="button"
              className={page === "requests" ? "active" : ""}
              onClick={() => navigate("requests")}
            >
              <span className="mtab-icon" aria-hidden="true">📨</span>
              <span className="mtab-label">My Requests</span>
            </button>
            <button
              type="button"
              className={page === "seller" ? "active" : ""}
              onClick={() => navigate("seller")}
            >
              <span className="mtab-icon" aria-hidden="true">🏪</span>
              <span className="mtab-label">Sell</span>
            </button>
          </div>
        </div>
      )}

      <main className="market-main gv-page-enter">
        <ProductCatalogue
          openRequest={openRequest}
          category={category}
          condition={condition}
          filteredProducts={filteredProducts}
          marketType={marketType}
          navigate={navigate}
          openProduct={openProduct}
          page={page}
          platform={platform}
          products={products}
          search={search}
          selectedProduct={selectedProduct}
          setCategory={setCategory}
          setCondition={setCondition}
          setMarketType={setMarketType}
          setPlatform={setPlatform}
          setSearch={setSearch}
          setSelectedProduct={setSelectedProduct}
          setSortBy={setSortBy}
          sortBy={sortBy}
          toggleWishlist={toggleWishlist}
          wishlist={wishlist}
        />



        {page === "requests" && (
          <RequestsView navigate={navigate} notify={notify} user={user} />
        )}

        {page === "seller" && (
          <SellerView
            category={category}
            condition={condition}
            deleteProduct={deleteProduct}
            editProduct={editProduct}
            editingId={editingId}
            notify={notify}
            platform={platform}
            products={products}
            saveProduct={saveProduct}
            sellerForm={sellerForm}
            setEditingId={setEditingId}
            setSellerForm={setSellerForm}
            user={user}
          />
        )}
      </main>

      {requestProduct && (
        <RequestModal
          product={requestProduct}
          onClose={() => setRequestProduct(null)}
          onSent={() => {
            setRequestProduct(null);
            notify("Request sent! The admin will review it first.");
            navigate("requests");
          }}
        />
      )}
    </div>
  );
}
