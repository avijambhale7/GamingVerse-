import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref, set, push, update, remove } from "firebase/database";

import { auth, db } from "../firebase";
import "./Marketplace.css";

const DEMO_PRODUCTS = [
  {
    id: "demo1",
    name: "Grand Theft Auto V",
    platform: "PS5",
    category: "Action",
    condition: "Used",
    price: 1499,
    stock: 5,
    rating: 4.8,
    sellerId: "demo-seller",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    description: "Original GTA V gaming disc in good working condition.",
    demo: true,
  },
  {
    id: "demo2",
    name: "Cyberpunk 2077",
    platform: "PS5",
    category: "RPG",
    condition: "New",
    price: 2499,
    stock: 4,
    rating: 4.7,
    sellerId: "demo-seller",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
    description: "Cyberpunk 2077 original gaming disc.",
    demo: true,
  },
  {
    id: "demo3",
    name: "God of War Ragnarök",
    platform: "PS5",
    category: "Adventure",
    condition: "Used",
    price: 1999,
    stock: 3,
    rating: 4.9,
    sellerId: "demo-seller",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    description: "Pre-owned God of War Ragnarök disc.",
    demo: true,
  },
  {
    id: "demo4",
    name: "Minecraft",
    platform: "Xbox",
    category: "Adventure",
    condition: "New",
    price: 1799,
    stock: 6,
    rating: 4.6,
    sellerId: "demo-seller",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1586182987320-4f17e9b6a2b2?auto=format&fit=crop&w=900&q=80",
    description: "Minecraft original game disc for Xbox.",
    demo: true,
  },
  {
    id: "demo5",
    name: "Ghost of Tsushima",
    platform: "PS5",
    category: "Adventure",
    condition: "Used",
    price: 1899,
    stock: 4,
    rating: 4.9,
    sellerId: "demo-seller",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    description: "Excellent-condition Ghost of Tsushima disc.",
    demo: true,
  },
  {
    id: "demo6",
    name: "Assassin's Creed Shadows",
    platform: "PC",
    category: "Action",
    condition: "New",
    price: 2899,
    stock: 2,
    rating: 4.5,
    sellerId: "demo-seller",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=80",
    description: "Original Assassin's Creed Shadows copy.",
    demo: true,
  },
];

const ACCESSORY_PRODUCTS = [
  {
    id: "acc1",
    productType: "accessory",
    accessoryType: "Mouse",
    name: "Logitech G102 LIGHTSYNC Gaming Mouse",
    platform: "PC",
    category: "Mouse",
    condition: "New",
    price: 1299,
    mrp: 1799,
    stock: 8,
    rating: 4.6,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1000&q=85",
    description:
      "Wired RGB gaming mouse with high-precision tracking for PC gaming.",
    amazonUrl: "https://www.amazon.in/s?k=Logitech+G102+LIGHTSYNC+gaming+mouse",
    flipkartUrl:
      "https://www.flipkart.com/search?q=Logitech+G102+LIGHTSYNC+gaming+mouse",
    demo: true,
  },
  {
    id: "acc2",
    productType: "accessory",
    accessoryType: "Keyboard",
    name: "Redragon K552 Mechanical Gaming Keyboard",
    platform: "PC",
    category: "Keyboard",
    condition: "New",
    price: 2499,
    mrp: 3499,
    stock: 6,
    rating: 4.5,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=85",
    description: "Mechanical RGB gaming keyboard with tactile switches.",
    amazonUrl:
      "https://www.amazon.in/s?k=Redragon+K552+mechanical+gaming+keyboard",
    flipkartUrl:
      "https://www.flipkart.com/search?q=Redragon+K552+mechanical+gaming+keyboard",
    demo: true,
  },
  {
    id: "acc3",
    productType: "accessory",
    accessoryType: "Headset",
    name: "HyperX Cloud Stinger 2 Gaming Headset",
    platform: "PC",
    category: "Headset",
    condition: "New",
    price: 2999,
    mrp: 3999,
    stock: 7,
    rating: 4.4,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1000&q=85",
    description:
      "Comfortable gaming headset with clear audio and flexible microphone.",
    amazonUrl:
      "https://www.amazon.in/s?k=HyperX+Cloud+Stinger+2+gaming+headset",
    flipkartUrl:
      "https://www.flipkart.com/search?q=HyperX+Cloud+Stinger+2+gaming+headset",
    demo: true,
  },
  {
    id: "acc4",
    productType: "accessory",
    accessoryType: "Controller",
    name: "Xbox Wireless Controller",
    platform: "Xbox",
    category: "Controller",
    condition: "New",
    price: 5199,
    mrp: 5999,
    stock: 4,
    rating: 4.7,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=1000&q=85",
    description:
      "Wireless Xbox controller for Xbox and compatible Windows PCs.",
    amazonUrl: "https://www.amazon.in/s?k=Xbox+wireless+controller",
    flipkartUrl: "https://www.flipkart.com/search?q=Xbox+wireless+controller",
    demo: true,
  },
  {
    id: "acc5",
    productType: "accessory",
    accessoryType: "Mouse Pad",
    name: "RGB Extended Gaming Mouse Pad",
    platform: "PC",
    category: "Mouse Pad",
    condition: "New",
    price: 999,
    mrp: 1499,
    stock: 12,
    rating: 4.5,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1613141411244-0e4ac259d217?auto=format&fit=crop&w=1000&q=85",
    description: "Large desk-sized RGB mouse pad with smooth tracking surface.",
    amazonUrl: "https://www.amazon.in/s?k=RGB+extended+gaming+mouse+pad",
    flipkartUrl:
      "https://www.flipkart.com/search?q=RGB+extended+gaming+mouse+pad",
    demo: true,
  },
  {
    id: "acc6",
    productType: "accessory",
    accessoryType: "Webcam",
    name: "Logitech C920 HD Pro Webcam",
    platform: "PC",
    category: "Webcam",
    condition: "New",
    price: 5499,
    mrp: 6999,
    stock: 5,
    rating: 4.6,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=1000&q=85",
    description:
      "Full HD webcam for streaming, gaming calls and content creation.",
    amazonUrl: "https://www.amazon.in/s?k=Logitech+C920+webcam",
    flipkartUrl: "https://www.flipkart.com/search?q=Logitech+C920+webcam",
    demo: true,
  },
  {
    id: "acc7",
    productType: "accessory",
    accessoryType: "Microphone",
    name: "USB RGB Gaming Microphone",
    platform: "PC",
    category: "Microphone",
    condition: "New",
    price: 3499,
    mrp: 4999,
    stock: 6,
    rating: 4.3,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=85",
    description:
      "USB condenser microphone for streaming, voice chat and recording.",
    amazonUrl: "https://www.amazon.in/s?k=USB+RGB+gaming+microphone",
    flipkartUrl: "https://www.flipkart.com/search?q=USB+RGB+gaming+microphone",
    demo: true,
  },
  {
    id: "acc8",
    productType: "accessory",
    accessoryType: "Monitor",
    name: "24-inch 180Hz Gaming Monitor",
    platform: "PC",
    category: "Monitor",
    condition: "New",
    price: 8999,
    mrp: 11999,
    stock: 3,
    rating: 4.5,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=85",
    description: "Fast-refresh gaming monitor for smooth competitive gameplay.",
    amazonUrl: "https://www.amazon.in/s?k=24+inch+180Hz+gaming+monitor",
    flipkartUrl:
      "https://www.flipkart.com/search?q=24+inch+180Hz+gaming+monitor",
    demo: true,
  },
  {
    id: "acc9",
    productType: "accessory",
    accessoryType: "Speakers",
    name: "RGB 2.1 Gaming Speakers",
    platform: "PC",
    category: "Speakers",
    condition: "New",
    price: 2199,
    mrp: 2999,
    stock: 9,
    rating: 4.2,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=85",
    description: "Compact 2.1 desktop speakers with gaming RGB lighting.",
    amazonUrl: "https://www.amazon.in/s?k=RGB+2.1+gaming+speakers",
    flipkartUrl: "https://www.flipkart.com/search?q=RGB+2.1+gaming+speakers",
    demo: true,
  },
  {
    id: "acc10",
    productType: "accessory",
    accessoryType: "Cooling Pad",
    name: "Dual Fan RGB Laptop Cooling Pad",
    platform: "Laptop",
    category: "Cooling Pad",
    condition: "New",
    price: 1499,
    mrp: 2299,
    stock: 10,
    rating: 4.1,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=85",
    description:
      "Dual-fan cooling pad for gaming laptops with adjustable stand.",
    amazonUrl: "https://www.amazon.in/s?k=RGB+laptop+cooling+pad+dual+fan",
    flipkartUrl:
      "https://www.flipkart.com/search?q=RGB+laptop+cooling+pad+dual+fan",
    demo: true,
  },
  {
    id: "acc11",
    productType: "accessory",
    accessoryType: "Gamepad",
    name: "8BitDo Ultimate 2C Wireless Gamepad",
    platform: "PC",
    category: "Gamepad",
    condition: "New",
    price: 3499,
    mrp: 4499,
    stock: 5,
    rating: 4.6,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&w=1000&q=85",
    description:
      "Wireless PC gamepad designed for comfortable long gaming sessions.",
    amazonUrl: "https://www.amazon.in/s?k=8BitDo+Ultimate+wireless+gamepad",
    flipkartUrl: "https://www.flipkart.com/search?q=wireless+gaming+gamepad",
    demo: true,
  },
  {
    id: "acc12",
    productType: "accessory",
    accessoryType: "USB Hub",
    name: "7-Port RGB USB Gaming Hub",
    platform: "PC",
    category: "USB Hub",
    condition: "New",
    price: 1299,
    mrp: 1799,
    stock: 11,
    rating: 4.2,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1000&q=85",
    description:
      "Multi-port USB hub for connecting gaming peripherals and devices.",
    amazonUrl: "https://www.amazon.in/s?k=7+port+RGB+USB+gaming+hub",
    flipkartUrl: "https://www.flipkart.com/search?q=7+port+RGB+USB+gaming+hub",
    demo: true,
  },
  {
    id: "acc13",
    productType: "accessory",
    accessoryType: "Headset Stand",
    name: "RGB Gaming Headset Stand",
    platform: "PC",
    category: "Headset Stand",
    condition: "New",
    price: 899,
    mrp: 1299,
    stock: 14,
    rating: 4.3,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1616763355548-1b606f439f86?auto=format&fit=crop&w=1000&q=85",
    description: "RGB desktop stand that keeps your gaming headset organized.",
    amazonUrl: "https://www.amazon.in/s?k=RGB+gaming+headset+stand",
    flipkartUrl: "https://www.flipkart.com/search?q=RGB+gaming+headset+stand",
    demo: true,
  },
  {
    id: "acc14",
    productType: "accessory",
    accessoryType: "Cable",
    name: "Braided Gaming Cable Kit",
    platform: "PC",
    category: "Cable",
    condition: "New",
    price: 699,
    mrp: 999,
    stock: 20,
    rating: 4.0,
    sellerId: "gamingverse-accessories",
    sellerName: "GamingVerse Store",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85",
    description:
      "Braided cable kit for cleaner gaming desk and accessory connections.",
    amazonUrl: "https://www.amazon.in/s?k=braided+gaming+cable+kit",
    flipkartUrl: "https://www.flipkart.com/search?q=braided+gaming+cable+kit",
    demo: true,
  },
];

const MARKET_TABS = [
  {
    id: "games",
    icon: "🎮",
    label: "Games / CDs",
    subtitle: "PS5 • PS4 • Xbox • PC",
  },
  {
    id: "accessories",
    icon: "🖱️",
    label: "Computer & Gaming Accessories",
    subtitle: "Mouse • Keyboard • Headset • Monitor & more",
  },
];

const ACCESSORY_CATEGORIES = [
  "All",
  "Mouse",
  "Keyboard",
  "Headset",
  "Controller",
  "Mouse Pad",
  "Webcam",
  "Microphone",
  "Monitor",
];

function getOnlineSearchUrl(platform, productName) {
  const query = encodeURIComponent(productName);
  if (platform === "Amazon") {
    return `https://www.amazon.in/s?k=${query}`;
  }
  return `https://www.flipkart.com/search?q=${query}`;
}

const ORDER_STEPS = ["Placed", "Confirmed", "Packed", "Shipped", "Delivered"];

const EMPTY_PRODUCT = {
  name: "",
  platform: "PS5",
  category: "Action",
  condition: "New",
  price: "",
  stock: "",
  image: "",
  description: "",
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function Marketplace() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([
    ...DEMO_PRODUCTS,
    ...ACCESSORY_PRODUCTS,
  ]);
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

  const notify = (text) => {
    setToast(text);

    clearTimeout(window.marketToastTimer);

    window.marketToastTimer = setTimeout(() => {
      setToast("");
    }, 2500);
  };

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
      const productsSnap = await get(ref(db, "products"));

      // Always keep the built-in marketplace catalog available.
      // Firebase products are added on top of it when present.
      let firebaseProducts = [];

      if (productsSnap.exists()) {
        const data = productsSnap.val();

        firebaseProducts = Object.entries(data)
          .map(([id, product]) => ({
            id,
            ...product,
            productType: product.productType || "game",
          }))
          .filter((product) => product.status !== "blocked");
      }

      const firebaseGameProducts = firebaseProducts.filter(
        (product) => product.productType !== "accessory",
      );

      const firebaseAccessoryProducts = firebaseProducts.filter(
        (product) => product.productType === "accessory",
      );

      const loadedProducts = [
        ...DEMO_PRODUCTS,
        ...firebaseGameProducts,
        ...ACCESSORY_PRODUCTS,
        ...firebaseAccessoryProducts,
      ];

      setProducts(loadedProducts);

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

      // Keep both marketplace sections usable even if Firebase is
      // unavailable or the database node/rules are not configured yet.
      setProducts([...DEMO_PRODUCTS, ...ACCESSORY_PRODUCTS]);

      if (currentUser) {
        setCart([]);
        setWishlist([]);
        setOrders([]);
      }

      notify("Showing GamingVerse marketplace catalog.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const sourceProducts =
      marketType === "accessories" ? ACCESSORY_PRODUCTS : DEMO_PRODUCTS;

    let result = [...sourceProducts];

    // Include seller-added Firebase products for the matching section.
    const firebaseMatches = products.filter((product) =>
      marketType === "accessories"
        ? product.productType === "accessory" &&
          !sourceProducts.some((demo) => demo.id === product.id)
        : product.productType !== "accessory" &&
          !sourceProducts.some((demo) => demo.id === product.id),
    );

    result = [...result, ...firebaseMatches];

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
        if (item.productId.startsWith("demo")) {
          continue;
        }

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
        if (item.productId.startsWith("demo")) {
          continue;
        }

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

  const renderHeader = () => (
    <div className="market-header">
      <div>
        <span className="market-kicker">GAMINGVERSE MARKETPLACE</span>

        <h1>Gaming Marketplace</h1>

        <p>Buy games, CDs and computer & gaming accessories.</p>
      </div>

      <div className="market-nav">
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
      </div>
    </div>
  );

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

  const renderCart = () => (
    <section className="section-page">
      <button className="back-btn" onClick={() => navigate("products")}>
        ← Marketplace
      </button>

      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div>🛒</div>
          <h3>Cart is empty</h3>
          <button className="primary-btn" onClick={() => navigate("products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-image">
                  {item.image ? <img src={item.image} alt={item.name} /> : "🎮"}
                </div>

                <div className="cart-info">
                  <h3>{item.name}</h3>

                  <p>{item.platform}</p>

                  <strong>{money(item.price)}</strong>
                </div>

                <div className="quantity">
                  <button
                    onClick={() =>
                      updateCart(item.productId, Number(item.quantity) - 1)
                    }
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateCart(item.productId, Number(item.quantity) + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <strong>
                  {money(Number(item.price) * Number(item.quantity))}
                </strong>

                <button
                  className="danger-link"
                  onClick={() => removeCartItem(item.productId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>

            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div>
              <span>Delivery</span>
              <strong>{delivery === 0 ? "FREE" : money(delivery)}</strong>
            </div>

            <hr />

            <div className="total-row">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              className="primary-btn full"
              onClick={() => navigate("checkout")}
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );

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

  const renderCheckout = () => (
    <section className="section-page">
      <button className="back-btn" onClick={() => navigate("cart")}>
        ← Back to Cart
      </button>

      <h2>Checkout</h2>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-left">
          <div className="form-card">
            <h3>Delivery Information</h3>

            <div className="form-grid">
              <label>
                Full Name *
                <input
                  value={checkout.fullName}
                  onChange={(e) => setCheckoutField("fullName", e.target.value)}
                />
              </label>

              <label>
                Mobile *
                <input
                  value={checkout.phone}
                  onChange={(e) => setCheckoutField("phone", e.target.value)}
                />
              </label>

              <label className="full">
                Address *
                <textarea
                  rows="3"
                  value={checkout.address}
                  onChange={(e) => setCheckoutField("address", e.target.value)}
                />
              </label>

              <label>
                City *
                <input
                  value={checkout.city}
                  onChange={(e) => setCheckoutField("city", e.target.value)}
                />
              </label>

              <label>
                State *
                <input
                  value={checkout.state}
                  onChange={(e) => setCheckoutField("state", e.target.value)}
                />
              </label>

              <label>
                Pincode *
                <input
                  maxLength="6"
                  value={checkout.pincode}
                  onChange={(e) =>
                    setCheckoutField(
                      "pincode",
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                />
              </label>
            </div>
          </div>

          <div className="form-card">
            <h3>Payment Method</h3>

            <label className="payment-option">
              <input
                type="radio"
                checked={checkout.paymentMethod === "COD"}
                onChange={() => setCheckoutField("paymentMethod", "COD")}
              />

              <div>
                <strong>Cash on Delivery</strong>

                <span>Pay after delivery.</span>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                checked={checkout.paymentMethod === "Online Demo"}
                onChange={() =>
                  setCheckoutField("paymentMethod", "Online Demo")
                }
              />

              <div>
                <strong>Online Payment (Demo)</strong>

                <span>
                  Demo payment for college project. No real money is charged.
                </span>
              </div>
            </label>
          </div>
        </div>

        <aside className="summary-card">
          <h3>Order Summary</h3>

          {cart.map((item) => (
            <div className="summary-item" key={item.productId}>
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong>
                {money(Number(item.price) * Number(item.quantity))}
              </strong>
            </div>
          ))}

          <hr />

          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div>
            <span>Delivery</span>
            <strong>{delivery === 0 ? "FREE" : money(delivery)}</strong>
          </div>

          <div className="total-row">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>

          <button type="submit" className="primary-btn full">
            Place Order
          </button>
        </aside>
      </form>
    </section>
  );

  const renderTracker = (status) => {
    const currentIndex = ORDER_STEPS.indexOf(status);

    return (
      <div className="tracker">
        {ORDER_STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={
                index <= currentIndex ? "tracker-step done" : "tracker-step"
              }
            >
              <div className="tracker-circle">
                {index <= currentIndex ? "✓" : index + 1}
              </div>

              <span>{step}</span>
            </div>

            {index < ORDER_STEPS.length - 1 && (
              <div
                className={
                  index < currentIndex ? "tracker-line done" : "tracker-line"
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderOrders = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <div>🔐</div>
          <h3>Login required</h3>
        </div>
      );
    }

    const myOrders = orders.filter((order) => order.buyerId === user.uid);

    return (
      <section className="section-page">
        <h2>My Orders</h2>

        {myOrders.length === 0 ? (
          <div className="empty-state">
            <div>📦</div>
            <h3>No orders yet</h3>

            <button
              className="primary-btn"
              onClick={() => navigate("products")}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {myOrders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-top">
                  <div>
                    <small>ORDER #{order.orderNumber}</small>

                    <h3>{money(order.total)}</h3>
                  </div>

                  <strong>{order.orderStatus}</strong>
                </div>

                {renderTracker(order.orderStatus)}

                <div className="ordered-items">
                  {(order.items || []).map((item, index) => (
                    <div key={item.productId + index}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <strong>
                        {money(Number(item.price) * Number(item.quantity))}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="order-bottom">
                  <span>Payment: {order.paymentMethod}</span>

                  {!["Cancelled", "Shipped", "Delivered"].includes(
                    order.orderStatus,
                  ) && (
                    <button
                      className="danger-btn"
                      onClick={() => cancelOrder(order)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderSeller = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <div>🔐</div>
          <h3>Login required</h3>
        </div>
      );
    }

    const myProducts = products.filter(
      (product) => product.sellerId === user.uid && !product.demo,
    );

    const sellerOrders = orders.filter((order) => order.sellerId === user.uid);

    return (
      <section className="section-page">
        <div className="seller-title">
          <div>
            <span className="hero-badge">SHOP OWNER</span>

            <h2>Seller Dashboard</h2>

            <p>Add CDs, manage stock and process customer orders.</p>
          </div>

          <div className="seller-stats">
            <div>
              <strong>{myProducts.length}</strong>
              <span>Products</span>
            </div>

            <div>
              <strong>{sellerOrders.length}</strong>
              <span>Orders</span>
            </div>
          </div>
        </div>

        <div className="seller-grid">
          <form className="form-card" onSubmit={saveProduct}>
            <h3>{editingId ? "Edit CD" : "Add Gaming CD"}</h3>

            <div className="form-grid">
              <label className="full">
                Game Name *
                <input
                  value={sellerForm.name}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="GTA V"
                />
              </label>

              <label>
                Platform
                <select
                  value={sellerForm.platform}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      platform: e.target.value,
                    }))
                  }
                >
                  <option>PS5</option>
                  <option>PS4</option>
                  <option>Xbox</option>
                  <option>PC</option>
                </select>
              </label>

              <label>
                Category
                <select
                  value={sellerForm.category}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option>Action</option>
                  <option>Adventure</option>
                  <option>RPG</option>
                  <option>Racing</option>
                  <option>Sports</option>
                </select>
              </label>

              <label>
                Condition
                <select
                  value={sellerForm.condition}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                  }
                >
                  <option>New</option>
                  <option>Used</option>
                </select>
              </label>

              <label>
                Price *
                <input
                  type="number"
                  min="1"
                  value={sellerForm.price}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Stock *
                <input
                  type="number"
                  min="1"
                  value={sellerForm.stock}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      stock: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="full">
                Image URL
                <input
                  value={sellerForm.image}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      image: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="full">
                Description
                <textarea
                  rows="4"
                  value={sellerForm.description}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button className="primary-btn full" type="submit">
              {editingId ? "Update Product" : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn full cancel-edit"
                onClick={() => {
                  setEditingId(null);
                  setSellerForm(EMPTY_PRODUCT);
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>

          <div className="form-card">
            <h3>My Products</h3>

            {myProducts.length === 0 ? (
              <div className="seller-empty">No products added.</div>
            ) : (
              <div className="seller-products">
                {myProducts.map((product) => (
                  <div className="seller-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>

                      <span>
                        {product.platform}
                        {" • "}
                        {money(product.price)}
                      </span>

                      <small>Stock: {product.stock}</small>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() => editProduct(product)}
                    >
                      Edit
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => deleteProduct(product)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-card seller-orders">
          <h3>Customer Orders</h3>

          {sellerOrders.length === 0 ? (
            <div className="seller-empty">No customer orders yet.</div>
          ) : (
            <div className="seller-orders-list">
              {sellerOrders.map((order) => {
                const currentIndex = ORDER_STEPS.indexOf(order.orderStatus);

                const nextStatus =
                  currentIndex >= 0 && currentIndex < ORDER_STEPS.length - 1
                    ? ORDER_STEPS[currentIndex + 1]
                    : null;

                return (
                  <div className="seller-order" key={order.id}>
                    <div>
                      <strong>#{order.orderNumber}</strong>

                      <span>{order.buyerName}</span>

                      <small>{money(order.total)}</small>
                    </div>

                    <span className="status">{order.orderStatus}</span>

                    {nextStatus && (
                      <button
                        className="primary-btn"
                        onClick={() => updateOrderStatus(order, nextStatus)}
                      >
                        Mark as {nextStatus}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="market-loading">
        <h2>Loading GamingVerse Marketplace...</h2>
      </div>
    );
  }

  return (
    <div className="gamingverse-marketplace">
      {toast && <div className="market-toast">{toast}</div>}

      {renderHeader()}

      <main className="market-main">
        {page === "products" && renderProducts()}

        {page === "details" && renderDetails()}

        {page === "wishlist" && renderWishlist()}

        {page === "cart" && renderCart()}

        {page === "checkout" && renderCheckout()}

        {page === "orders" && renderOrders()}

        {page === "seller" && renderSeller()}
      </main>
    </div>
  );
}
