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

import CartView from "./marketplace/views/CartView.jsx";
import CheckoutView from "./marketplace/views/CheckoutView.jsx";
import MarketHeader from "./marketplace/views/MarketHeader.jsx";
import OrdersView from "./marketplace/views/OrdersView.jsx";
import ProductCatalogue from "./marketplace/views/ProductCatalogue.jsx";
import SellerView from "./marketplace/views/SellerView.jsx";

export default function Marketplace({ embedded = false }) {
  const routeNavigate = useRouterNavigate();
  const navigateToGames = () => routeNavigate("/games");
  const navigateToCafe = () => routeNavigate("/cafe");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState("products");
  const [marketType, setMarketType] = useState("accessories");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  const [toast, setToast] = useState("");

  const [checkout, setCheckout] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

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
      // above. Keeping it out of this user-data loader prevents a later cart,
      // wishlist or order read from overwriting the live marketplace catalog.

      if (!currentUser) {
        setCart([]);
        setWishlist([]);
        setOrders([]);
        setLoading(false);
        return;
      }

      const cartSnap = await get(ref(db, `cart/${currentUser.uid}`));

      const wishlistSnap = await get(ref(db, `wishlists/${currentUser.uid}`));

      const ordersSnap = await get(ref(db, "orders"));

      setCart(cartSnap.exists() ? Object.values(cartSnap.val()) : []);

      setWishlist(wishlistSnap.exists() ? Object.keys(wishlistSnap.val()) : []);

      if (ordersSnap.exists()) {
        const data = ordersSnap.val();

        const myOrders = Object.entries(data)
          .map(([id, order]) => ({
            id,
            ...order,
          }))
          .filter(
            (order) =>
              order.buyerId === currentUser.uid ||
              order.sellerId === currentUser.uid,
          )
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        setOrders(myOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Marketplace load error:", error);

      // Do not reset the marketplace catalog here. The `products` node is
      // maintained by the realtime listener above. A failure while loading
      // cart/wishlist/orders must never remove owner-added marketplace items.

      if (currentUser) {
        setCart([]);
        setWishlist([]);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setCheckout((prev) => ({
          ...prev,
          fullName: currentUser.displayName || "",
          phone: currentUser.phoneNumber || "",
        }));
      }

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

  const cartCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  const delivery = subtotal === 0 ? 0 : subtotal >= 2500 ? 0 : 100;

  const total = subtotal + delivery;

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

  const addToCart = async (product, quantity = 1) => {
    if (!requireLogin()) return;

    if (Number(product.stock || 0) <= 0) {
      notify("Product is out of stock.");
      return;
    }

    const existing = cart.find((item) => item.productId === product.id);

    const newQuantity = existing
      ? Number(existing.quantity) + Number(quantity)
      : Number(quantity);

    if (newQuantity > Number(product.stock || 0)) {
      notify(`Only ${product.stock} item(s) available.`);
      return;
    }

    const item = {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: newQuantity,
      image: product.image || "",
      platform: product.platform || "",
      sellerId: product.sellerId || "",
      sellerName: product.sellerName || "",
    };

    try {
      await set(ref(db, `cart/${user.uid}/${product.id}`), item);

      setCart((prev) => [
        ...prev.filter((x) => x.productId !== product.id),
        item,
      ]);

      notify("Added to cart.");
    } catch (error) {
      console.error(error);
      notify("Could not add to cart.");
    }
  };

  const updateCart = async (productId, quantity) => {
    if (!user) return;

    if (quantity <= 0) {
      await remove(ref(db, `cart/${user.uid}/${productId}`));

      setCart((prev) => prev.filter((item) => item.productId !== productId));

      return;
    }

    const product = products.find((p) => p.id === productId);

    if (!product) return;

    if (quantity > Number(product.stock || 0)) {
      notify(`Only ${product.stock} available.`);
      return;
    }

    const current = cart.find((item) => item.productId === productId);

    if (!current) return;

    const updatedItem = {
      ...current,
      quantity,
    };

    await set(ref(db, `cart/${user.uid}/${productId}`), updatedItem);

    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? updatedItem : item)),
    );
  };

  const removeCartItem = async (productId) => {
    if (!user) return;

    await remove(ref(db, `cart/${user.uid}/${productId}`));

    setCart((prev) => prev.filter((item) => item.productId !== productId));

    notify("Item removed.");
  };

  const setCheckoutField = (field, value) => {
    setCheckout((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!requireLogin()) return;

    if (cart.length === 0) {
      notify("Your cart is empty.");
      return;
    }

    if (
      !checkout.fullName.trim() ||
      !checkout.phone.trim() ||
      !checkout.address.trim() ||
      !checkout.city.trim() ||
      !checkout.state.trim() ||
      !checkout.pincode.trim()
    ) {
      notify("Please fill all delivery details.");
      return;
    }

    if (!/^\d{6}$/.test(checkout.pincode.trim())) {
      notify("Enter a valid pincode.");
      return;
    }

    try {
      for (const item of cart) {
        const productSnap = await get(ref(db, `products/${item.productId}`));

        if (!productSnap.exists()) {
          notify(`${item.name} is unavailable.`);
          return;
        }

        const product = productSnap.val();

        if (Number(item.quantity) > Number(product.stock || 0)) {
          notify(`${item.name} does not have enough stock.`);
          return;
        }
      }

      /*
        For a simple college-project flow,
        one cart becomes one order.
      */

      const newOrderRef = push(ref(db, "orders"));

      const orderData = {
        orderNumber: "GV-" + Date.now().toString().slice(-8),

        buyerId: user.uid,

        buyerName: checkout.fullName.trim(),

        buyerEmail: user.email || "",

        sellerId: cart[0]?.sellerId || "",

        sellerName: cart[0]?.sellerName || "GamingVerse Seller",

        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image || "",
          platform: item.platform || "",
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),

        subtotal,

        deliveryFee: delivery,

        total,

        paymentMethod: checkout.paymentMethod,

        paymentStatus:
          checkout.paymentMethod === "Online Demo" ? "paid" : "pending",

        orderStatus: "Placed",

        address: {
          fullName: checkout.fullName.trim(),
          phone: checkout.phone.trim(),
          address: checkout.address.trim(),
          city: checkout.city.trim(),
          state: checkout.state.trim(),
          pincode: checkout.pincode.trim(),
        },

        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newOrderRef, orderData);

      /*
        Reduce inventory.
      */
      for (const item of cart) {
        const productRef = ref(db, `products/${item.productId}`);

        const snap = await get(productRef);

        if (!snap.exists()) continue;

        const product = snap.val();

        await update(productRef, {
          stock: Math.max(
            Number(product.stock || 0) - Number(item.quantity || 0),
            0,
          ),
          updatedAt: Date.now(),
        });
      }

      await remove(ref(db, `cart/${user.uid}`));

      setOrders((prev) => [
        {
          id: newOrderRef.key,
          ...orderData,
        },
        ...prev,
      ]);

      setCart([]);

      notify("Order placed successfully.");

      setTimeout(() => {
        navigate("orders");
      }, 700);
    } catch (error) {
      console.error(error);
      notify("Could not place order.");
    }
  };

  const cancelOrder = async (order) => {
    if (!user) return;

    if (order.buyerId !== user.uid) {
      notify("You cannot cancel this order.");
      return;
    }

    if (["Shipped", "Delivered", "Cancelled"].includes(order.orderStatus)) {
      notify("This order cannot be cancelled.");
      return;
    }

    const yes = window.confirm("Are you sure you want to cancel this order?");

    if (!yes) return;

    try {
      await update(ref(db, `orders/${order.id}`), {
        orderStatus: "Cancelled",
        updatedAt: Date.now(),
      });

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                orderStatus: "Cancelled",
              }
            : item,
        ),
      );

      notify("Order cancelled.");
    } catch (error) {
      console.error(error);
      notify("Cancellation failed.");
    }
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

  const updateOrderStatus = async (order, nextStatus) => {
    if (!user) return;

    if (order.sellerId !== user.uid) {
      notify("You are not the seller.");
      return;
    }

    try {
      await update(ref(db, `orders/${order.id}`), {
        orderStatus: nextStatus,
        updatedAt: Date.now(),
      });

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                orderStatus: nextStatus,
              }
            : item,
        ),
      );

      notify(`Order marked as ${nextStatus}.`);
    } catch (error) {
      console.error(error);
      notify("Could not update order.");
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
          cartCount={cartCount}
          embedded={embedded}
          navigate={navigate}
          navigateToCafe={navigateToCafe}
          navigateToGames={navigateToGames}
          page={page}
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
              🛍 Shop
            </button>
            <button
              type="button"
              className={page === "wishlist" ? "active" : ""}
              onClick={() => navigate("wishlist")}
            >
              ♡ Wishlist{wishlist.length ? ` (${wishlist.length})` : ""}
            </button>
            <button
              type="button"
              className={page === "cart" ? "active" : ""}
              onClick={() => navigate("cart")}
            >
              🛒 Cart{cartCount ? ` (${cartCount})` : ""}
            </button>
            <button
              type="button"
              className={page === "orders" ? "active" : ""}
              onClick={() => navigate("orders")}
            >
              📦 Orders
            </button>
            <button
              type="button"
              className={page === "seller" ? "active" : ""}
              onClick={() => navigate("seller")}
            >
              🏪 Sell
            </button>
          </div>
        </div>
      )}

      <main className="market-main gv-page-enter">
        <ProductCatalogue
          addToCart={addToCart}
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



        {page === "cart" && (
          <CartView
            cart={cart}
            delivery={delivery}
            navigate={navigate}
            platform={platform}
            removeCartItem={removeCartItem}
            subtotal={subtotal}
            total={total}
            updateCart={updateCart}
          />
        )}

        {page === "checkout" && (
          <CheckoutView
            cart={cart}
            checkout={checkout}
            delivery={delivery}
            navigate={navigate}
            placeOrder={placeOrder}
            setCheckoutField={setCheckoutField}
            subtotal={subtotal}
            total={total}
          />
        )}

        {page === "orders" && (
          <OrdersView
            cancelOrder={cancelOrder}
            navigate={navigate}
            orders={orders}
            total={total}
            user={user}
          />
        )}

        {page === "seller" && (
          <SellerView
            category={category}
            condition={condition}
            deleteProduct={deleteProduct}
            editProduct={editProduct}
            editingId={editingId}
            orders={orders}
            platform={platform}
            products={products}
            saveProduct={saveProduct}
            sellerForm={sellerForm}
            setEditingId={setEditingId}
            setSellerForm={setSellerForm}
            total={total}
            updateOrderStatus={updateOrderStatus}
            user={user}
          />
        )}
      </main>
    </div>
  );
}
