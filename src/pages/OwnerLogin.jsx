import React, { useEffect, useMemo, useState } from "react";
import "./OwnerDashboard.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, onValue, push, ref, remove, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

const OWNER_ROLES = new Set([
  "owner",
  "cafe_owner",
  "shop_owner",
  "accessory_owner",
]);
const ACCESSORY_CATEGORIES = [
  "Gaming Mouse",
  "Gaming Keyboard",
  "Headset",
  "Controller",
  "Mouse Pad",
  "Webcam",
  "Microphone",
  "Monitor",
  "Speakers",
  "Cooling Pad",
  "Gamepad",
  "USB Hub",
  "Other",
];
const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];
const EMPTY_PRODUCT = {
  name: "",
  category: "Gaming Mouse",
  price: "",
  stock: "",
  image: "",
  description: "",
};

const CAFE_NAMES = {
  cafe1: "Rapid Round Cafe",
  cafe2: "Dragon Lord Esports | Gaming Cafe",
  cafe3: "TGT Esports Studio | Gaming Cafe",
  cafe4: "Ministry of Esports",
  cafe5: "Vibezone Esports Lounge",
  cafe6: "Boomer's Gaming Café",
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function ownerRoleLabel(role) {
  if (role === "cafe_owner") return "Café Owner";
  if (role === "shop_owner" || role === "accessory_owner")
    return "Accessories Owner";
  return "Business Owner";
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview");
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ownedCafeIds, setOwnedCafeIds] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [message, setMessage] = useState("");

  const canCafe = role === "owner" || role === "cafe_owner";
  const canAccessories =
    role === "owner" ||
    role === "cafe_owner" ||
    role === "shop_owner" ||
    role === "accessory_owner";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/owner-login", { replace: true });
        return;
      }

      setUser(currentUser);
      try {
        const snap = await get(ref(db, `users/${currentUser.uid}`));
        const data = snap.exists() ? snap.val() : {};
        const nextRole = String(data.role || "").toLowerCase();
        if (!OWNER_ROLES.has(nextRole)) {
          await signOut(auth);
          navigate("/owner-login", { replace: true });
          return;
        }
        setRole(nextRole);
        setProfile(data);
        const rawOwnedCafeIds = data.ownedCafeIds;
        const normalizedOwnedCafeIds = Array.isArray(rawOwnedCafeIds)
          ? rawOwnedCafeIds.filter(Boolean)
          : rawOwnedCafeIds && typeof rawOwnedCafeIds === "object"
            ? Object.entries(rawOwnedCafeIds)
                .filter(([, enabled]) => enabled === true)
                .map(([cafeId]) => cafeId)
            : [];
        setOwnedCafeIds(normalizedOwnedCafeIds);
        if (nextRole === "cafe_owner") setSection("cafe");
        if (nextRole === "shop_owner" || nextRole === "accessory_owner")
          setSection("accessories");
      } catch (error) {
        console.error("Owner profile load error:", error);
        setMessage("Could not load owner profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!canAccessories) return undefined;
    const productsRef = ref(db, "products");
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, product]) => ({ id, ...product }))
          .filter(
            (product) =>
              product.sellerId === auth.currentUser?.uid &&
              product.productType === "accessory" &&
              product.status !== "blocked",
          )
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setProducts(next);
      },
      (error) => {
        console.error("Owner products listener error:", error);
        setMessage("Could not load your accessory inventory.");
      },
    );
    return () => unsubscribe();
  }, [canAccessories]);

  useEffect(() => {
    if (!canAccessories) return undefined;
    const ordersRef = ref(db, "orders");
    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, order]) => ({ id, ...order }))
          .filter((order) => order.sellerId === auth.currentUser?.uid)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setOrders(next);
      },
      (error) => {
        console.error("Owner orders listener error:", error);
        setMessage("Could not load your orders.");
      },
    );
    return () => unsubscribe();
  }, [canAccessories]);

  useEffect(() => {
    if (!canCafe) return undefined;
    const bookingsRef = ref(db, "cafeBookings");
    const unsubscribe = onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const flattened = [];
        Object.entries(data).forEach(([customerId, customerBookings]) => {
          Object.entries(customerBookings || {}).forEach(([id, booking]) => {
            const cafeAllowed =
              role === "owner" ||
              !ownedCafeIds.length ||
              ownedCafeIds.includes(booking.cafeId);
            if (!cafeAllowed) return;
            flattened.push({
              id,
              customerId,
              ...booking,
            });
          });
        });
        flattened.sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
        );
        setBookings(flattened);
      },
      (error) => {
        console.error("Owner booking listener error:", error);
        setMessage("Could not load café bookings. Check Firebase permissions.");
      },
    );
    return () => unsubscribe();
  }, [canCafe, role, ownedCafeIds]);

  const totalAccessorySales = useMemo(
    () =>
      orders
        .filter((order) => order.orderStatus !== "Cancelled")
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders],
  );

  const pendingBookings = bookings.filter(
    (booking) =>
      !["Cancelled", "Completed"].includes(String(booking.status || "")),
  );

  const updateBookingStatus = async (booking, status) => {
    const currentStatus = String(booking.status || "Pending");
    const nextStatus = String(status || "Pending");
    if (currentStatus === nextStatus) return;

    const occupiedStatuses = new Set(["Pending", "Confirmed"]);
    const wasOccupied = occupiedStatuses.has(currentStatus);
    const willBeOccupied = occupiedStatuses.has(nextStatus);
    const slotKey = String(booking.time || "")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    try {
      if (
        wasOccupied !== willBeOccupied &&
        booking.cafeId &&
        booking.date &&
        slotKey
      ) {
        const slotRef = ref(
          db,
          `cafeSlots/${booking.cafeId}/${booking.date}/${slotKey}`,
        );
        const tx = await import("firebase/database").then(
          ({ runTransaction }) =>
            runTransaction(slotRef, (current) => {
              const booked = Math.max(0, Number(current?.booked || 0));
              const nextBooked = willBeOccupied
                ? booked + 1
                : Math.max(0, booked - 1);
              return {
                ...(current || {}),
                booked: nextBooked,
                updatedAt: Date.now(),
              };
            }),
        );

        if (!tx.committed) {
          setMessage("Could not update the café slot availability.");
          return;
        }
      }

      await update(
        ref(db, `cafeBookings/${booking.customerId}/${booking.id}`),
        {
          status: nextStatus,
          ownerUpdatedAt: Date.now(),
          ownerId: user.uid,
          ...(nextStatus === "Confirmed" ? { confirmedAt: Date.now() } : {}),
          ...(nextStatus === "Rejected" ? { rejectedAt: Date.now() } : {}),
          ...(nextStatus === "Completed" ? { completedAt: Date.now() } : {}),
        },
      );

      setMessage(
        `${booking.customerName || "Customer"}'s ${booking.time || ""} booking is now ${nextStatus}.`,
      );
    } catch (error) {
      console.error("Booking status update error:", error);
      setMessage("Could not update booking status.");
    }
  };

  const acceptBooking = (booking) => updateBookingStatus(booking, "Confirmed");
  const rejectBooking = (booking) => updateBookingStatus(booking, "Rejected");
  const saveAccessory = async (event) => {
    event.preventDefault();
    const name = productForm.name.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);

    if (
      !name ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      setMessage("Enter a product name, valid price and stock.");
      return;
    }

    setSavingProduct(true);
    try {
      const sellerName =
        user.displayName || user.email?.split("@")[0] || "GamingVerse Seller";
      const productData = {
        productType: "accessory",
        accessoryType: productForm.category,
        name,
        platform: "PC",
        category: productForm.category,
        condition: "New",
        price,
        stock,
        rating: 0,
        sellerId: user.uid,
        sellerName,
        image: productForm.image.trim(),
        description: productForm.description.trim(),
        status: "active",
        updatedAt: Date.now(),
      };

      if (editingId) {
        const { update: dbUpdate } = await import("firebase/database");
        await dbUpdate(ref(db, `products/${editingId}`), productData);
        setMessage("Accessory updated.");
      } else {
        const productRef = push(ref(db, "products"));
        await import("firebase/database").then(({ set }) =>
          set(productRef, { ...productData, createdAt: Date.now() }),
        );
        setMessage("Accessory added to the marketplace.");
      }

      setEditingId(null);
      setProductForm(EMPTY_PRODUCT);
    } catch (error) {
      console.error("Save accessory error:", error);
      setMessage("Could not save accessory.");
    } finally {
      setSavingProduct(false);
    }
  };

  const editAccessory = (product) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name || "",
      category: product.category || "Other",
      price: product.price || "",
      stock: product.stock || "",
      image: product.image || "",
      description: product.description || "",
    });
    setSection("accessories");
  };

  const deleteAccessory = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await remove(ref(db, `products/${product.id}`));
      setMessage("Accessory deleted.");
    } catch (error) {
      console.error("Delete accessory error:", error);
      setMessage("Could not delete accessory.");
    }
  };

  const updateOrderStatus = async (order, status) => {
    try {
      await update(ref(db, `orders/${order.id}`), {
        orderStatus: status,
        updatedAt: Date.now(),
      });
      setMessage(
        `Order #${order.orderNumber || order.id.slice(-6)} marked ${status}.`,
      );
    } catch (error) {
      console.error("Order status error:", error);
      setMessage("Could not update order.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/owner-login", { replace: true });
  };

  if (loading)
    return (
      <div className="owner-dashboard-loading">Loading owner dashboard...</div>
    );

  if (!user || !OWNER_ROLES.has(role)) return null;

  return (
    <div className="owner-dashboard-page">
      <header className="owner-dashboard-header">
        <div>
          <span className="owner-dashboard-kicker">GAMINGVERSE BUSINESS</span>
          <h1>Owner Dashboard</h1>
          <p>
            {profile.businessName || profile.shopName || ownerRoleLabel(role)}
          </p>
        </div>
        <div className="owner-dashboard-header-actions">
          <span className="owner-role-pill">{ownerRoleLabel(role)}</span>
          <button type="button" onClick={() => navigate("/games")}>
            GamingVerse
          </button>
          <button type="button" className="owner-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="owner-dashboard-tabs">
        {(role === "owner"
          ? ["overview", "cafe", "accessories"]
          : canCafe && canAccessories
            ? ["cafe", "accessories"]
            : canCafe
              ? ["cafe"]
              : ["accessories"]
        ).map((item) => (
          <button
            key={item}
            type="button"
            className={section === item ? "active" : ""}
            onClick={() => setSection(item)}
          >
            {item === "overview"
              ? "Overview"
              : item === "cafe"
                ? "☕ Café Bookings"
                : "🖱 Accessories Shop"}
          </button>
        ))}
      </nav>

      {message && (
        <div className="owner-dashboard-message">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      {section === "overview" && role === "owner" && (
        <main className="owner-dashboard-main">
          <section className="owner-stat-grid">
            <article>
              <span>Café Bookings</span>
              <strong>{bookings.length}</strong>
              <small>{pendingBookings.length} active</small>
            </article>
            <article>
              <span>Accessories</span>
              <strong>{products.length}</strong>
              <small>live products</small>
            </article>
            <article>
              <span>Accessory Orders</span>
              <strong>{orders.length}</strong>
              <small>
                {orders.filter((x) => x.orderStatus === "Placed").length}{" "}
                awaiting action
              </small>
            </article>
            <article>
              <span>Sales</span>
              <strong>{money(totalAccessorySales)}</strong>
              <small>non-cancelled orders</small>
            </article>
          </section>

          <section className="owner-overview-grid">
            <button
              type="button"
              className="owner-module-card"
              onClick={() => setSection("cafe")}
            >
              <span className="owner-module-icon">☕</span>
              <h2>Manage Café</h2>
              <p>
                Review customer reservations, confirm or cancel bookings and
                keep an eye on your café activity.
              </p>
              <strong>Open Café Manager →</strong>
            </button>
            <button
              type="button"
              className="owner-module-card"
              onClick={() => setSection("accessories")}
            >
              <span className="owner-module-icon">🖱</span>
              <h2>Manage Accessories</h2>
              <p>
                Add computer and gaming accessories, update stock, remove
                products and process orders.
              </p>
              <strong>Open Accessories Manager →</strong>
            </button>
          </section>
        </main>
      )}

      {section === "cafe" && canCafe && (
        <main className="owner-dashboard-main">
          <section className="owner-section-head">
            <div>
              <span className="owner-dashboard-kicker">CAFÉ OPERATIONS</span>
              <h2>Manage Café Bookings</h2>
              <p>
                Monitor reservations and update the booking status for your
                café.
              </p>
            </div>
            <div className="owner-mini-stat">
              <strong>{bookings.length}</strong>
              <span>Total bookings</span>
            </div>
          </section>

          <section className="owner-table-card">
            {bookings.length === 0 ? (
              <div className="owner-empty">
                <span>☕</span>
                <strong>No café booking requests</strong>
                <p>
                  Customer requests will appear here with hourly slot, date and
                  customer details.
                </p>
              </div>
            ) : (
              <div className="owner-booking-list">
                {bookings.map((booking) => {
                  const status = String(booking.status || "Pending");
                  const pending = status === "Pending";
                  const confirmed = status === "Confirmed";
                  return (
                    <article
                      key={`${booking.customerId}-${booking.id}`}
                      className={`owner-booking-row owner-booking-${status.toLowerCase()}`}
                    >
                      <div className="owner-booking-details">
                        <span className="owner-small-label">{status}</span>
                        <h3>
                          {booking.cafeName ||
                            CAFE_NAMES[booking.cafeId] ||
                            "Gaming Café"}
                        </h3>
                        <p>
                          📅 {booking.date} &nbsp; • &nbsp; 🕐 {booking.time}{" "}
                          &nbsp; • &nbsp; 🎮{" "}
                          {booking.station || "Gaming station"}
                        </p>
                        <small>
                          {booking.address || "Address unavailable"}
                        </small>
                        <small className="owner-customer-info">
                          Customer:{" "}
                          <strong>
                            {booking.customerName || "GamingVerse User"}
                          </strong>
                          {booking.customerEmail
                            ? ` • ${booking.customerEmail}`
                            : ""}
                          {booking.customerPhone
                            ? ` • ${booking.customerPhone}`
                            : ""}
                        </small>
                        {booking.createdAt && (
                          <small className="owner-request-time">
                            Requested{" "}
                            {new Date(booking.createdAt).toLocaleString(
                              "en-IN",
                            )}
                          </small>
                        )}
                      </div>
                      <div className="owner-row-actions owner-booking-actions">
                        {pending && (
                          <>
                            <button
                              type="button"
                              className="owner-confirm-btn"
                              onClick={() => acceptBooking(booking)}
                            >
                              ✓ Accept
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => rejectBooking(booking)}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {confirmed && (
                          <>
                            <button
                              type="button"
                              className="owner-complete-btn"
                              onClick={() =>
                                updateBookingStatus(booking, "Completed")
                              }
                            >
                              ✓ Completed
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                updateBookingStatus(booking, "Cancelled")
                              }
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {!pending && !confirmed && (
                          <span className="owner-final-status">{status}</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {section === "accessories" && canAccessories && (
        <main className="owner-dashboard-main">
          <section className="owner-section-head">
            <div>
              <span className="owner-dashboard-kicker">
                COMPUTER & GAMING ACCESSORIES
              </span>
              <h2>Accessories Shop Manager</h2>
              <p>
                Add products, manage inventory and process accessory orders from
                one place.
              </p>
            </div>
            <div className="owner-sales-stats">
              <div>
                <strong>{products.length}</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>{orders.length}</strong>
                <span>Orders</span>
              </div>
              <div>
                <strong>{money(totalAccessorySales)}</strong>
                <span>Sales</span>
              </div>
            </div>
          </section>

          <section className="owner-accessory-grid">
            <form className="owner-form-card" onSubmit={saveAccessory}>
              <div className="owner-form-title">
                <div>
                  <span className="owner-dashboard-kicker">SELL</span>
                  <h3>{editingId ? "Edit Accessory" : "Add Accessory"}</h3>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setProductForm(EMPTY_PRODUCT);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <label>
                Product Name
                <input
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="RGB Gaming Mouse"
                />
              </label>
              <label>
                Category
                <select
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  {ACCESSORY_CATEGORIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="owner-form-two">
                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="1"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, price: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, stock: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label>
                Image URL
                <input
                  value={productForm.image}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, image: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>
              <label>
                Description
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows="4"
                  placeholder="Describe the accessory..."
                />
              </label>
              <button
                className="owner-primary-btn"
                type="submit"
                disabled={savingProduct}
              >
                {savingProduct
                  ? "Saving..."
                  : editingId
                    ? "Update Accessory"
                    : "Add to Marketplace"}
              </button>
            </form>

            <div className="owner-inventory-card">
              <div className="owner-card-title">
                <div>
                  <span className="owner-dashboard-kicker">INVENTORY</span>
                  <h3>Your Accessories</h3>
                </div>
                <span>{products.length}</span>
              </div>
              {products.length === 0 ? (
                <div className="owner-empty small">
                  <span>🖱</span>
                  <strong>No accessories yet</strong>
                  <p>Add your first computer or gaming accessory.</p>
                </div>
              ) : (
                <div className="owner-product-list">
                  {products.map((product) => (
                    <article key={product.id} className="owner-product-row">
                      <div className="owner-product-thumb">
                        {product.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          <span>🖱</span>
                        )}
                      </div>
                      <div className="owner-product-info">
                        <strong>{product.name}</strong>
                        <span>
                          {product.category} • Stock {product.stock}
                        </span>
                        <b>{money(product.price)}</b>
                      </div>
                      <div className="owner-row-actions">
                        <button
                          type="button"
                          onClick={() => editAccessory(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => deleteAccessory(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="owner-table-card owner-orders-card">
            <div className="owner-card-title">
              <div>
                <span className="owner-dashboard-kicker">ORDERS</span>
                <h3>Accessory Orders</h3>
              </div>
              <span>{orders.length}</span>
            </div>
            {orders.length === 0 ? (
              <div className="owner-empty small">
                <span>📦</span>
                <strong>No accessory orders yet</strong>
              </div>
            ) : (
              <div className="owner-booking-list">
                {orders.map((order) => (
                  <article key={order.id} className="owner-booking-row">
                    <div>
                      <span className="owner-small-label">
                        Order #{order.orderNumber || order.id.slice(-6)}
                      </span>
                      <h3>{money(order.total)}</h3>
                      <p>
                        {(order.items || [])
                          .map((item) => `${item.name} × ${item.quantity}`)
                          .join(" • ")}
                      </p>
                      <small>
                        Payment: {order.paymentMethod || "Not specified"}
                      </small>
                    </div>
                    <div className="owner-row-actions">
                      <select
                        value={order.orderStatus || "Placed"}
                        onChange={(event) =>
                          updateOrderStatus(order, event.target.value)
                        }
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
