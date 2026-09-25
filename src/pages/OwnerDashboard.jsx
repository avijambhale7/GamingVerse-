import { useEffect, useMemo, useRef, useState } from "react";
import "./OwnerDashboard.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, onValue, push, ref, remove, set, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import PageSkeleton from "../components/PageSkeleton.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import PurchaseRequestList from "../components/PurchaseRequestList.jsx";
import usePurchaseRequests from "../utils/usePurchaseRequests.js";
import { REQUEST_STATUS } from "../utils/purchaseRequests.js";
import ImageUploadButton from "../components/ImageUploadButton.jsx";
import {
  DEFAULT_PRICE_PER_HOUR,
  DEFAULT_TOTAL_SEATS,
  normalizeCafe,
} from "./cafe/utils/cafeModel.js";
import { decodeTicket } from "./cafe/utils/ticket.js";
import { todayISO } from "./cafe/utils/time.js";
import {
  bookingSeats,
  releaseSeats,
  reserveSeats,
} from "./cafe/utils/slots.js";
import WalkInBookingForm from "./owner/views/WalkInBookingForm.jsx";
import jsQR from "jsqr";

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
const EMPTY_PRODUCT = {
  name: "",
  category: "Gaming Mouse",
  price: "",
  stock: "",
  image: "",
  description: "",
};
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EMPTY_NEW_CAFE = {
  name: "",
  address: "",
  phone: "",
  email: "",
  opening: "10:00 AM",
  closing: "10:00 PM",
};
const EMPTY_CAFE_OVERLAY = {
  name: "",
  address: "",
  phone: "",
  email: "",
  opening: "",
  closing: "",
  website: "",
  mapUrl: "",
  about: "",
  photosText: "",
  totalSeats: "",
  pricePerHour: "",
  specs: [],
  closedDays: [],
  blockedDatesText: "",
};
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function ownerRoleLabel(role) {
  if (role === "cafe_owner") return "Café Owner";
  if (role === "shop_owner" || role === "accessory_owner")
    return "Accessories Owner";
  return "Business Owner";
}

// Status filter for the café booking queue. "Cancelled" also covers
// rejected requests since both are closed-out bookings.
function matchesBookingFilter(booking, filter) {
  const status = String(booking.status || "Pending");
  if (filter === "All") return true;
  if (filter === "Cancelled")
    return status === "Cancelled" || status === "Rejected";
  return status === filter;
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
  const [ownedCafeIds, setOwnedCafeIds] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [message, setMessage] = useState("");
  const [bookingFilter, setBookingFilter] = useState("All");
  const [showWalkIn, setShowWalkIn] = useState(false);

  const [cafeSection, setCafeSection] = useState("bookings");
  const [allCafes, setAllCafes] = useState([]);
  const [activeCafeId, setActiveCafeId] = useState("");
  const [cafeOverlayForm, setCafeOverlayForm] = useState(EMPTY_CAFE_OVERLAY);
  const [savingCafeDetails, setSavingCafeDetails] = useState(false);
  const [newCafeForm, setNewCafeForm] = useState(EMPTY_NEW_CAFE);
  const [creatingCafe, setCreatingCafe] = useState(false);
  const [revenueMonth, setRevenueMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const videoRef = useRef(null);
  const scanFrameRef = useRef(null);

  const canCafe = role === "owner" || role === "cafe_owner";
  const canAccessories =
    role === "owner" ||
    role === "cafe_owner" ||
    role === "shop_owner" ||
    role === "accessory_owner";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);
      try {
        const snap = await get(ref(db, `users/${currentUser.uid}`));
        const data = snap.exists() ? snap.val() : {};
        const nextRole = String(data.role || "").toLowerCase();
        if (!OWNER_ROLES.has(nextRole)) {
          await signOut(auth);
          navigate("/login", { replace: true });
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

  // Every café an owner can manage lives at cafes/{id} — there is no seed
  // directory to pick from any more. A "owner" (site-wide business owner)
  // sees every café; a cafe_owner only sees the ones they created.
  useEffect(() => {
    if (!canCafe) return undefined;
    const unsubscribe = onValue(
      ref(db, "cafes"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, raw]) => normalizeCafe(id, raw))
          .filter(Boolean)
          .sort((a, b) => b.createdAt - a.createdAt);
        setAllCafes(next);
      },
      (error) => {
        console.error("Owner cafes listener error:", error);
        setMessage("Could not load café listings.");
      },
    );
    return () => unsubscribe();
  }, [canCafe]);

  const editableCafes = useMemo(() => {
    if (!canCafe) return [];
    return role === "owner"
      ? allCafes
      : allCafes.filter((c) => ownedCafeIds.includes(c.id));
  }, [canCafe, role, ownedCafeIds, allCafes]);

  const effectiveCafeId = activeCafeId || editableCafes[0]?.id || "";

  // The café edit form is seeded from live data once per café selection,
  // then left alone (an effect keyed on the café list would re-run and
  // clobber in-progress edits every time any field of the café changes).
  // Adjusting state during render — rather than in an effect — is the
  // pattern React recommends for "reset local state when a prop changes".
  const [syncedCafeId, setSyncedCafeId] = useState("");
  if (effectiveCafeId && effectiveCafeId !== syncedCafeId) {
    const cafe = editableCafes.find((c) => c.id === effectiveCafeId);
    if (cafe) {
      setSyncedCafeId(effectiveCafeId);
      setCafeOverlayForm({
        name: cafe.name,
        address: cafe.address,
        phone: cafe.phone,
        email: cafe.email,
        opening: cafe.opening,
        closing: cafe.closing,
        website: cafe.website,
        mapUrl: cafe.mapUrl,
        about: cafe.about,
        photosText: cafe.photos.join("\n"),
        totalSeats: cafe.totalSeats || "",
        pricePerHour: cafe.pricePerHour || "",
        specs: cafe.specs,
        closedDays: cafe.closedDays,
        blockedDatesText: cafe.blockedDates.join("\n"),
      });
    }
  }

  const createCafe = async (event) => {
    event.preventDefault();
    if (!newCafeForm.name.trim() || !newCafeForm.address.trim()) {
      setMessage("Enter at least a café name and address.");
      return;
    }
    setCreatingCafe(true);
    try {
      const newCafeRef = push(ref(db, "cafes"));
      const newCafeId = newCafeRef.key;

      // ownedCafeIds must be set before the café doc write, since the
      // café's own write rule checks that this account already owns it.
      await set(ref(db, `users/${user.uid}/ownedCafeIds/${newCafeId}`), true);

      await set(newCafeRef, {
        name: newCafeForm.name.trim(),
        address: newCafeForm.address.trim(),
        phone: newCafeForm.phone.trim(),
        email: newCafeForm.email.trim(),
        opening: newCafeForm.opening.trim(),
        closing: newCafeForm.closing.trim(),
        ownerUid: user.uid,
        status: "pending",
        createdAt: Date.now(),
      });

      setOwnedCafeIds((prev) => [...prev, newCafeId]);
      setActiveCafeId(newCafeId);
      setNewCafeForm(EMPTY_NEW_CAFE);
      setMessage(
        "Café listed! Add photos, setups and pricing below — a GamingVerse admin will review it before it's visible to customers.",
      );
    } catch (error) {
      console.error("Create cafe error:", error);
      setMessage("Could not create your café listing.");
    } finally {
      setCreatingCafe(false);
    }
  };

  const addSpecRow = () => {
    setCafeOverlayForm((form) => ({
      ...form,
      specs: [
        ...form.specs,
        {
          id: `spec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: "PC",
          label: "",
          details: "",
          price: "",
        },
      ],
    }));
  };

  const updateSpecRow = (id, field, value) => {
    setCafeOverlayForm((form) => ({
      ...form,
      specs: form.specs.map((spec) =>
        spec.id === id ? { ...spec, [field]: value } : spec,
      ),
    }));
  };

  const removeSpecRow = (id) => {
    setCafeOverlayForm((form) => ({
      ...form,
      specs: form.specs.filter((spec) => spec.id !== id),
    }));
  };

  const toggleClosedDay = (day) => {
    setCafeOverlayForm((form) => ({
      ...form,
      closedDays: form.closedDays.includes(day)
        ? form.closedDays.filter((d) => d !== day)
        : [...form.closedDays, day],
    }));
  };

  const saveCafeDetails = async (event) => {
    event.preventDefault();
    if (!effectiveCafeId) return;
    if (!cafeOverlayForm.name.trim() || !cafeOverlayForm.address.trim()) {
      setMessage("Café name and address are required.");
      return;
    }
    setSavingCafeDetails(true);
    try {
      const specsObject = {};
      cafeOverlayForm.specs.forEach((spec) => {
        if (!spec.label.trim()) return;
        specsObject[spec.id] = {
          type: spec.type,
          label: spec.label.trim(),
          details: spec.details.trim(),
          price: Number(spec.price) || DEFAULT_PRICE_PER_HOUR,
        };
      });

      await update(ref(db, `cafes/${effectiveCafeId}`), {
        name: cafeOverlayForm.name.trim(),
        address: cafeOverlayForm.address.trim(),
        phone: cafeOverlayForm.phone.trim(),
        email: cafeOverlayForm.email.trim(),
        opening: cafeOverlayForm.opening.trim(),
        closing: cafeOverlayForm.closing.trim(),
        website: cafeOverlayForm.website.trim(),
        mapUrl: cafeOverlayForm.mapUrl.trim(),
        about: cafeOverlayForm.about.trim(),
        photos: cafeOverlayForm.photosText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        totalSeats: Number(cafeOverlayForm.totalSeats) || 0,
        pricePerHour: Number(cafeOverlayForm.pricePerHour) || 0,
        specs: specsObject,
        closedDays: cafeOverlayForm.closedDays,
        blockedDates: cafeOverlayForm.blockedDatesText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        ownerUid: user.uid,
        updatedAt: Date.now(),
      });
      setMessage("Café details saved.");
    } catch (error) {
      console.error("Save cafe details error:", error);
      setMessage("Could not save café details.");
    } finally {
      setSavingCafeDetails(false);
    }
  };

  const monthlyCompletedBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (String(booking.status || "") !== "Completed") return false;
      const when = new Date(Number(booking.completedAt || booking.createdAt || 0));
      return (
        when.getFullYear() === revenueMonth.year &&
        when.getMonth() === revenueMonth.month
      );
    });
  }, [bookings, revenueMonth]);

  const monthlyRevenue = monthlyCompletedBookings.reduce(
    (sum, booking) => sum + Number(booking.totalPrice || 0),
    0,
  );

  const stopScanner = () => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  const handleScan = async (text) => {
    stopScanner();
    setScanError("");
    const decoded = decodeTicket(text);
    if (!decoded) {
      setScanResult({ ok: false, message: "Unrecognised QR code." });
      return;
    }
    try {
      const snap = await get(
        ref(db, `cafeBookings/${decoded.uid}/${decoded.bookingId}`),
      );
      if (!snap.exists()) {
        setScanResult({ ok: false, message: "Booking not found." });
        return;
      }
      const booking = {
        id: decoded.bookingId,
        customerId: decoded.uid,
        ...snap.val(),
      };
      const cafeAllowed =
        role === "owner" || ownedCafeIds.includes(booking.cafeId);
      if (!cafeAllowed) {
        setScanResult({
          ok: false,
          message: "This ticket is for a different café.",
        });
        return;
      }
      if (booking.date !== todayISO()) {
        setScanResult({
          ok: false,
          message: `This ticket is for ${booking.date}, not today.`,
        });
        return;
      }
      if (booking.status === "Completed") {
        setScanResult({
          ok: false,
          message: "This ticket has already been checked in.",
        });
        return;
      }
      if (booking.status !== "Confirmed") {
        setScanResult({
          ok: false,
          message: `Booking status is "${booking.status}", not Confirmed.`,
        });
        return;
      }
      setScanResult({ ok: true, booking });
    } catch (error) {
      console.error("Scan lookup error:", error);
      setScanResult({ ok: false, message: "Could not verify this ticket." });
    }
  };

  useEffect(() => {
    if (cafeSection !== "scan" || scanResult) {
      stopScanner();
      return undefined;
    }

    let cancelled = false;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          handleScan(code.data);
          return;
        }
      }
      scanFrameRef.current = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        scanFrameRef.current = requestAnimationFrame(tick);
      })
      .catch((error) => {
        console.error("Camera access error:", error);
        setScanError("Could not access the camera. Check browser permissions.");
      });

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeSection, scanResult]);

  const { requests: buyerRequests } = usePurchaseRequests(
    "seller",
    canAccessories ? user?.uid : "",
  );
  const newRequestCount = buyerRequests.filter(
    (request) => request.status === REQUEST_STATUS.PENDING_SELLER,
  ).length;
  const acceptedRequestCount = buyerRequests.filter(
    (request) => request.status === REQUEST_STATUS.ACCEPTED,
  ).length;

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
    try {
      // Move the slot's seat counter by this booking's seat count. The
      // owner can always re-occupy (no capacity check) — they may be
      // overriding on purpose, e.g. re-confirming a rejected request.
      if (
        wasOccupied !== willBeOccupied &&
        booking.cafeId &&
        booking.date &&
        booking.time
      ) {
        if (willBeOccupied) {
          await reserveSeats(
            booking.cafeId,
            booking.date,
            booking.time,
            bookingSeats(booking),
            Infinity,
          );
        } else {
          await releaseSeats(
            booking.cafeId,
            booking.date,
            booking.time,
            bookingSeats(booking),
          );
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


  const logout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  if (loading)
    return (
      <PageSkeleton variant="list" />
    );

  if (!user || !OWNER_ROLES.has(role)) return null;

  return (
    <div className="owner-dashboard-page">
      <header className="owner-dashboard-header">
        <div className="dp-hero-identity">
          <span className="dp-hero-avatar" aria-hidden="true">
            {String(
              profile.businessName || profile.shopName || ownerRoleLabel(role),
            )
              .trim()
              .charAt(0)
              .toUpperCase()}
          </span>
          <div>
            <span className="owner-dashboard-kicker">GAMINGVERSE BUSINESS</span>
            <h1>Owner Dashboard</h1>
            <p>
              {profile.businessName || profile.shopName || ownerRoleLabel(role)}
            </p>
          </div>
        </div>
        <div className="owner-dashboard-header-actions">
          <NotificationBell path={`notifications/${user.uid}`} />
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
        <main className="owner-dashboard-main gv-page-enter">
          <section className="owner-stat-grid">
            <article>
              <i className="dp-stat-icon" aria-hidden="true">☕</i>
              <span>Café Bookings</span>
              <strong>{bookings.length}</strong>
              <small>{pendingBookings.length} active</small>
            </article>
            <article>
              <i className="dp-stat-icon" aria-hidden="true">🖱</i>
              <span>Accessories</span>
              <strong>{products.length}</strong>
              <small>live products</small>
            </article>
            <article>
              <i className="dp-stat-icon" aria-hidden="true">📨</i>
              <span>Buyer Requests</span>
              <strong>{buyerRequests.length}</strong>
              <small>{newRequestCount} awaiting your reply</small>
            </article>
            <article>
              <i className="dp-stat-icon" aria-hidden="true">🤝</i>
              <span>Accepted Deals</span>
              <strong>{acceptedRequestCount}</strong>
              <small>contacts shared</small>
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
                products and respond to buyer requests.
              </p>
              <strong>Open Accessories Manager →</strong>
            </button>
          </section>
        </main>
      )}

      {section === "cafe" && canCafe && (
        <main className="owner-dashboard-main gv-page-enter">
          <nav className="owner-cafe-subtabs">
            {["bookings", "details", "revenue", "scan"].map((item) => (
              <button
                key={item}
                type="button"
                className={cafeSection === item ? "active" : ""}
                onClick={() => setCafeSection(item)}
              >
                {item === "bookings"
                  ? "Bookings"
                  : item === "details"
                    ? "Café Details"
                    : item === "revenue"
                      ? "Revenue"
                      : "Scan Ticket"}
              </button>
            ))}
          </nav>

          {editableCafes.length > 1 && cafeSection !== "bookings" && (
            <div className="owner-cafe-picker">
              <label>
                Editing
                <select
                  value={effectiveCafeId}
                  onChange={(e) => setActiveCafeId(e.target.value)}
                >
                  {editableCafes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {cafeSection === "bookings" && (
            <>
              <section className="owner-section-head">
                <div>
                  <span className="owner-dashboard-kicker">CAFÉ OPERATIONS</span>
                  <h2>Manage Café Bookings</h2>
                  <p>
                    Monitor reservations and update the booking status for your
                    café.
                  </p>
                </div>
                <div className="owner-head-actions">
                  {editableCafes.length > 0 && (
                    <button
                      type="button"
                      className="owner-walkin-btn"
                      onClick={() => setShowWalkIn((v) => !v)}
                    >
                      {showWalkIn ? "✕ Close" : "➕ Walk-in booking"}
                    </button>
                  )}
                  <div className="owner-mini-stat">
                    <strong>{bookings.length}</strong>
                    <span>Total bookings</span>
                  </div>
                </div>
              </section>

              {showWalkIn && (
                <WalkInBookingForm
                  cafes={editableCafes}
                  ownerUid={user.uid}
                  onDone={(text) => {
                    setShowWalkIn(false);
                    if (text) setMessage(text);
                  }}
                />
              )}

              <nav className="dp-status-filter" aria-label="Filter bookings">
                {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(
                  (item) => {
                    const count = bookings.filter((b) =>
                      matchesBookingFilter(b, item),
                    ).length;
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`dp-status-chip is-${item.toLowerCase()}${
                          bookingFilter === item ? " active" : ""
                        }`}
                        onClick={() => setBookingFilter(item)}
                      >
                        <i aria-hidden="true" />
                        {item}
                        <b>{count}</b>
                      </button>
                    );
                  },
                )}
              </nav>

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
                {bookings
                  .filter((b) => matchesBookingFilter(b, bookingFilter))
                  .map((booking) => {
                  const status = String(booking.status || "Pending");
                  const bookingDate = booking.date
                    ? new Date(`${booking.date}T00:00:00`)
                    : null;
                  const validDate =
                    bookingDate && !Number.isNaN(bookingDate.getTime());
                  const customerName = String(
                    booking.customerName || "GamingVerse User",
                  );
                  const pending = status === "Pending";
                  const confirmed = status === "Confirmed";
                  return (
                    <article
                      key={`${booking.customerId}-${booking.id}`}
                      className={`owner-booking-row dp-booking-card owner-booking-${status.toLowerCase()}`}
                    >
                      <div className="dp-date-tile" aria-hidden="true">
                        <small>
                          {validDate
                            ? bookingDate.toLocaleDateString("en-IN", {
                                month: "short",
                              })
                            : "—"}
                        </small>
                        <strong>{validDate ? bookingDate.getDate() : "?"}</strong>
                        <small>
                          {validDate
                            ? bookingDate.toLocaleDateString("en-IN", {
                                weekday: "short",
                              })
                            : ""}
                        </small>
                      </div>
                      <div className="owner-booking-details">
                        <div className="dp-row-title">
                          <h3>{booking.cafeName || "Gaming Café"}</h3>
                          <span className="owner-small-label">{status}</span>
                        </div>
                        <div className="dp-meta-chips">
                          {booking.walkIn && (
                            <span className="dp-walkin-chip">🚶 Walk-in</span>
                          )}
                          <span>🕐 {booking.time}</span>
                          <span>🎮 {booking.station || "Gaming station"}</span>
                          {Number(booking.seats) > 1 && (
                            <span>👥 {booking.seats} seats</span>
                          )}
                          <span>
                            📍 {booking.address || "Address unavailable"}
                          </span>
                        </div>
                        <div className="dp-customer">
                          <span className="dp-customer-avatar" aria-hidden="true">
                            {customerName.trim().charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{customerName}</strong>
                            <small>
                              {[booking.customerEmail, booking.customerPhone]
                                .filter(Boolean)
                                .join(" • ") || "No contact details"}
                            </small>
                          </div>
                          {booking.createdAt && (
                            <small className="owner-request-time">
                              Requested{" "}
                              {new Date(booking.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )}
                            </small>
                          )}
                        </div>
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
                {!bookings.some((b) =>
                  matchesBookingFilter(b, bookingFilter),
                ) && (
                  <div className="owner-empty small">
                    <span>🔍</span>
                    <strong>No {bookingFilter.toLowerCase()} bookings</strong>
                    <p>Try another status filter.</p>
                  </div>
                )}
              </div>
            )}
              </section>
            </>
          )}

          {cafeSection === "details" && (
            <section className="owner-form-card owner-cafe-details-form">
              {!effectiveCafeId ? (
                <form onSubmit={createCafe}>
                  <div className="owner-form-title">
                    <div>
                      <span className="owner-dashboard-kicker">GET STARTED</span>
                      <h3>List Your Café</h3>
                    </div>
                  </div>
                  <p className="owner-cafe-intro">
                    Add your café so gamers can find and book it. You can add
                    photos, PC/console setups and pricing right after.
                  </p>

                  <label>
                    Café name
                    <input
                      value={newCafeForm.name}
                      onChange={(e) =>
                        setNewCafeForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Rapid Round Café"
                      required
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={newCafeForm.address}
                      onChange={(e) =>
                        setNewCafeForm((f) => ({ ...f, address: e.target.value }))
                      }
                      placeholder="Street, area, city"
                      required
                    />
                  </label>
                  <div className="owner-form-two">
                    <label>
                      Phone
                      <input
                        value={newCafeForm.phone}
                        onChange={(e) =>
                          setNewCafeForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="98765 43210"
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={newCafeForm.email}
                        onChange={(e) =>
                          setNewCafeForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="cafe@example.com"
                      />
                    </label>
                  </div>
                  <div className="owner-form-two">
                    <label>
                      Opening time
                      <input
                        value={newCafeForm.opening}
                        onChange={(e) =>
                          setNewCafeForm((f) => ({ ...f, opening: e.target.value }))
                        }
                        placeholder="10:00 AM"
                      />
                    </label>
                    <label>
                      Closing time
                      <input
                        value={newCafeForm.closing}
                        onChange={(e) =>
                          setNewCafeForm((f) => ({ ...f, closing: e.target.value }))
                        }
                        placeholder="10:00 PM"
                      />
                    </label>
                  </div>

                  <button
                    className="owner-primary-btn"
                    type="submit"
                    disabled={creatingCafe}
                  >
                    {creatingCafe ? "Listing..." : "List My Café"}
                  </button>
                </form>
              ) : (
                <form onSubmit={saveCafeDetails}>
                  <div className="owner-form-title">
                    <div>
                      <span className="owner-dashboard-kicker">EDIT</span>
                      <h3>Café Details</h3>
                    </div>
                    {(() => {
                      const status = editableCafes.find(
                        (c) => c.id === effectiveCafeId,
                      )?.status;
                      if (!status) return null;
                      return (
                        <span className={`owner-cafe-status-badge ${status}`}>
                          {status === "approved"
                            ? "✓ Live"
                            : status === "rejected"
                              ? "✕ Rejected"
                              : "⏳ Pending review"}
                        </span>
                      );
                    })()}
                  </div>

                  <label>
                    Café name
                    <input
                      value={cafeOverlayForm.name}
                      onChange={(e) =>
                        setCafeOverlayForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={cafeOverlayForm.address}
                      onChange={(e) =>
                        setCafeOverlayForm((f) => ({ ...f, address: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <div className="owner-form-two">
                    <label>
                      Phone
                      <input
                        value={cafeOverlayForm.phone}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({ ...f, phone: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={cafeOverlayForm.email}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({ ...f, email: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <div className="owner-form-two">
                    <label>
                      Opening time
                      <input
                        value={cafeOverlayForm.opening}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({ ...f, opening: e.target.value }))
                        }
                        placeholder="10:00 AM"
                      />
                    </label>
                    <label>
                      Closing time
                      <input
                        value={cafeOverlayForm.closing}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({ ...f, closing: e.target.value }))
                        }
                        placeholder="10:00 PM"
                      />
                    </label>
                  </div>
                  <div className="owner-form-two">
                    <label>
                      Website (optional)
                      <input
                        value={cafeOverlayForm.website}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({ ...f, website: e.target.value }))
                        }
                        placeholder="https://..."
                      />
                    </label>
                    <label>
                      Google Maps link (optional)
                      <input
                        value={cafeOverlayForm.mapUrl}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({ ...f, mapUrl: e.target.value }))
                        }
                        placeholder="https://maps.app.goo.gl/..."
                      />
                    </label>
                  </div>

                  <label>
                    About
                    <textarea
                      rows="3"
                      value={cafeOverlayForm.about}
                      onChange={(e) =>
                        setCafeOverlayForm((f) => ({ ...f, about: e.target.value }))
                      }
                      placeholder="Tell customers what makes your café worth visiting..."
                    />
                  </label>

                  <label>
                    Photos (one URL per line, or upload)
                    <textarea
                      rows="3"
                      value={cafeOverlayForm.photosText}
                      onChange={(e) =>
                        setCafeOverlayForm((f) => ({
                          ...f,
                          photosText: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                    <ImageUploadButton
                      pathPrefix={`cafePhotos/${user.uid}`}
                      label="Upload Photos"
                      multiple
                      onUploaded={(urls) =>
                        setCafeOverlayForm((f) => ({
                          ...f,
                          photosText: [f.photosText, ...urls]
                            .filter(Boolean)
                            .join("\n"),
                        }))
                      }
                      onError={setMessage}
                    />
                  </label>

                  <div className="owner-form-two">
                    <label>
                      Total seats
                      <input
                        type="number"
                        min="1"
                        value={cafeOverlayForm.totalSeats}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({
                            ...f,
                            totalSeats: e.target.value,
                          }))
                        }
                        placeholder={String(DEFAULT_TOTAL_SEATS)}
                      />
                    </label>
                    <label>
                      Default price (₹/hr)
                      <input
                        type="number"
                        min="1"
                        value={cafeOverlayForm.pricePerHour}
                        onChange={(e) =>
                          setCafeOverlayForm((f) => ({
                            ...f,
                            pricePerHour: e.target.value,
                          }))
                        }
                        placeholder={String(DEFAULT_PRICE_PER_HOUR)}
                      />
                    </label>
                  </div>

                  <div className="owner-spec-editor">
                    <div className="owner-form-title">
                      <span>Gaming setups (PC / Console specs)</span>
                      <button type="button" onClick={addSpecRow}>
                        + Add setup
                      </button>
                    </div>
                    {cafeOverlayForm.specs.map((spec) => (
                      <div className="owner-spec-row" key={spec.id}>
                        <select
                          value={spec.type}
                          onChange={(e) =>
                            updateSpecRow(spec.id, "type", e.target.value)
                          }
                        >
                          <option value="PC">PC</option>
                          <option value="Console">Console</option>
                        </select>
                        <input
                          value={spec.label}
                          onChange={(e) =>
                            updateSpecRow(spec.id, "label", e.target.value)
                          }
                          placeholder="RTX 4070 • 165Hz"
                        />
                        <input
                          value={spec.details}
                          onChange={(e) =>
                            updateSpecRow(spec.id, "details", e.target.value)
                          }
                          placeholder="Extra details (optional)"
                        />
                        <input
                          type="number"
                          min="1"
                          value={spec.price}
                          onChange={(e) =>
                            updateSpecRow(spec.id, "price", e.target.value)
                          }
                          placeholder="₹/hr"
                        />
                        <button
                          type="button"
                          className="danger"
                          onClick={() => removeSpecRow(spec.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <label>Closed days</label>
                  <div className="owner-weekday-chips">
                    {WEEKDAYS.map((day) => (
                      <button
                        type="button"
                        key={day}
                        className={
                          cafeOverlayForm.closedDays.includes(day) ? "active" : ""
                        }
                        onClick={() => toggleClosedDay(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <label>
                    Blocked dates (YYYY-MM-DD, one per line)
                    <textarea
                      rows="2"
                      value={cafeOverlayForm.blockedDatesText}
                      onChange={(e) =>
                        setCafeOverlayForm((f) => ({
                          ...f,
                          blockedDatesText: e.target.value,
                        }))
                      }
                      placeholder="2026-10-02"
                    />
                  </label>

                  <button
                    className="owner-primary-btn"
                    type="submit"
                    disabled={savingCafeDetails}
                  >
                    {savingCafeDetails ? "Saving..." : "Save Café Details"}
                  </button>
                </form>
              )}
            </section>
          )}

          {cafeSection === "revenue" && (
            <>
              <section className="owner-section-head">
                <div>
                  <span className="owner-dashboard-kicker">CAFÉ REVENUE</span>
                  <h2>Monthly Revenue</h2>
                  <p>Completed bookings across your café(s).</p>
                </div>
                <div className="owner-month-nav">
                  <button
                    type="button"
                    onClick={() =>
                      setRevenueMonth((m) =>
                        m.month === 0
                          ? { year: m.year - 1, month: 11 }
                          : { year: m.year, month: m.month - 1 },
                      )
                    }
                  >
                    ←
                  </button>
                  <strong>
                    {MONTH_NAMES[revenueMonth.month]} {revenueMonth.year}
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      setRevenueMonth((m) =>
                        m.month === 11
                          ? { year: m.year + 1, month: 0 }
                          : { year: m.year, month: m.month + 1 },
                      )
                    }
                  >
                    →
                  </button>
                </div>
              </section>

              <section className="owner-table-card">
                <div className="owner-revenue-summary">
                  <div>
                    <span>Total Revenue</span>
                    <strong>{money(monthlyRevenue)}</strong>
                  </div>
                  <div>
                    <span>Completed Bookings</span>
                    <strong>{monthlyCompletedBookings.length}</strong>
                  </div>
                </div>
                {monthlyCompletedBookings.length === 0 ? (
                  <div className="owner-empty small">
                    <span>💰</span>
                    <strong>No completed bookings this month</strong>
                  </div>
                ) : (
                  <div className="owner-booking-list">
                    {monthlyCompletedBookings.map((booking) => (
                      <article
                        key={`${booking.customerId}-${booking.id}`}
                        className="owner-booking-row"
                      >
                        <div>
                          <span className="owner-small-label">Completed</span>
                          <h3>{booking.cafeName}</h3>
                          <p>
                            📅 {booking.date} &nbsp; • &nbsp; 🕐 {booking.time}
                            {booking.specLabel ? ` • ${booking.specLabel}` : ""}
                          </p>
                        </div>
                        <div className="owner-row-actions">
                          <strong>{money(booking.totalPrice)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {cafeSection === "scan" && (
            <section className="owner-scanner-card">
              <div>
                <span className="owner-dashboard-kicker">CHECK-IN</span>
                <h2>Scan Ticket</h2>
                <p>Point the camera at a customer's booking QR code.</p>
              </div>

              {!scanResult && (
                <div className="owner-scanner-video-wrap">
                  <video ref={videoRef} muted playsInline />
                </div>
              )}
              {scanError && <div className="owner-scan-result error">{scanError}</div>}

              {scanResult && (
                <div
                  className={`owner-scan-result ${scanResult.ok ? "success" : "error"}`}
                >
                  {scanResult.ok ? (
                    <>
                      <strong>Ticket verified ✓</strong>
                      <p>{scanResult.booking.customerName}</p>
                      <small>
                        {scanResult.booking.date} • {scanResult.booking.time} •{" "}
                        {scanResult.booking.specLabel || scanResult.booking.station}
                      </small>
                    </>
                  ) : (
                    <strong>{scanResult.message}</strong>
                  )}
                  <div className="owner-row-actions">
                    {scanResult.ok && (
                      <button
                        type="button"
                        className="owner-confirm-btn"
                        onClick={async () => {
                          await updateBookingStatus(scanResult.booking, "Completed");
                          setScanResult(null);
                        }}
                      >
                        ✓ Confirm Check-In
                      </button>
                    )}
                    <button type="button" onClick={() => setScanResult(null)}>
                      Scan Again
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {section === "accessories" && canAccessories && (
        <main className="owner-dashboard-main gv-page-enter">
          <section className="owner-section-head">
            <div>
              <span className="owner-dashboard-kicker">
                COMPUTER & GAMING ACCESSORIES
              </span>
              <h2>Accessories Shop Manager</h2>
              <p>
                Add products, manage inventory and respond to buyer requests
                from one place.
              </p>
            </div>
            <div className="owner-sales-stats">
              <div>
                <strong>{products.length}</strong>
                <span>
                  <i aria-hidden="true">🖱</i> Products
                </span>
              </div>
              <div>
                <strong>{newRequestCount}</strong>
                <span>
                  <i aria-hidden="true">📨</i> New Requests
                </span>
              </div>
              <div>
                <strong>{acceptedRequestCount}</strong>
                <span>
                  <i aria-hidden="true">🤝</i> Accepted
                </span>
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

              <div className="dp-listing-preview" aria-label="Listing preview">
                <div className="dp-listing-preview-media">
                  {productForm.image ? (
                    <img src={productForm.image} alt="" />
                  ) : (
                    <span aria-hidden="true">🖱</span>
                  )}
                  <em>Live preview</em>
                </div>
                <div className="dp-listing-preview-body">
                  <small>{productForm.category}</small>
                  <strong>{productForm.name || "Your product name"}</strong>
                  <div>
                    <b>
                      {productForm.price ? money(productForm.price) : "₹ —"}
                    </b>
                    <span>
                      {productForm.stock === "" ||
                      productForm.stock === undefined
                        ? "Stock —"
                        : `${productForm.stock} in stock`}
                    </span>
                  </div>
                </div>
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
                Image
                <div className="image-field-row">
                  <input
                    value={productForm.image}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, image: e.target.value }))
                    }
                    placeholder="Paste a URL, or upload a photo →"
                  />
                  <ImageUploadButton
                    pathPrefix={`productImages/${user.uid}`}
                    label="Upload"
                    onUploaded={(url) =>
                      setProductForm((p) => ({ ...p, image: url }))
                    }
                    onError={setMessage}
                  />
                </div>
                {productForm.image && (
                  <img
                    src={productForm.image}
                    alt=""
                    className="image-field-preview"
                  />
                )}
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
                <div className="dp-product-grid">
                  {products.map((product) => {
                    const stock = Number(product.stock) || 0;
                    const stockState =
                      stock === 0 ? "out" : stock <= 5 ? "low" : "ok";
                    return (
                    <article
                      key={product.id}
                      className={`dp-product-card${
                        editingId === product.id ? " is-editing" : ""
                      }`}
                    >
                      <div className="dp-product-media">
                        {product.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          <span aria-hidden="true">🖱</span>
                        )}
                        <em className={`dp-stock-badge is-${stockState}`}>
                          {stockState === "out"
                            ? "Out of stock"
                            : stockState === "low"
                              ? `Only ${stock} left`
                              : `${stock} in stock`}
                        </em>
                      </div>
                      <div className="dp-product-body">
                        <small>{product.category}</small>
                        <strong title={product.name}>{product.name}</strong>
                        <b>{money(product.price)}</b>
                      </div>
                      <div className="owner-row-actions">
                        <button
                          type="button"
                          onClick={() => editAccessory(product)}
                        >
                          ✎ Edit
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
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="owner-table-card owner-orders-card">
            <div className="owner-card-title">
              <div>
                <span className="owner-dashboard-kicker">BUYER REQUESTS</span>
                <h3>Purchase Requests</h3>
              </div>
              <span>{newRequestCount} new</span>
            </div>
            <p className="owner-cafe-intro">
              Requests reach you after the admin approves them. Accept one to
              share mobile numbers with the buyer.
            </p>
            <PurchaseRequestList
              role="seller"
              uid={user.uid}
              onMessage={setMessage}
            />
          </section>
        </main>
      )}
    </div>
  );
}
