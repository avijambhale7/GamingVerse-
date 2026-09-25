import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  get,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
} from "firebase/database";
import { auth, db } from "../firebase";
import PageSkeleton from "../components/PageSkeleton.jsx";
import "./Cafe.css";

import {
  loadLocalBookings,
  localSlotCount,
  saveLocalBookings,
} from "./cafe/utils/localBookings.js";
import { getTimeSlots, localISO, todayISO } from "./cafe/utils/time.js";
import { isDateBlocked, normalizeCafe } from "./cafe/utils/cafeModel.js";
import CafeQrModal from "./cafe/views/CafeQrModal.jsx";

export default function Cafe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cafes, setCafes] = useState([]);
  const [selectedCafeId, setSelectedCafeId] = useState(null);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showBookings, setShowBookings] = useState(false);
  const [qrBooking, setQrBooking] = useState(null);
  // Ticks every minute so today's slot list drops slots as they start.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Cafés are entirely owner-created and live here. Reading from the same
  // subscription every café card and the booking view render from means a
  // café's details stay live-updated wherever it's shown.
  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, "cafes"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, raw]) => normalizeCafe(id, raw))
          .filter(Boolean)
          .sort((a, b) => b.createdAt - a.createdAt);
        setCafes(next);
      },
      (error) => {
        console.error("Cafes listener error:", error);
        setMessage("Could not load cafés. Please try again later.");
      },
    );
    return () => unsubscribe();
  }, []);

  const selectedCafe = useMemo(
    () => cafes.find((c) => c.id === selectedCafeId) || null,
    [cafes, selectedCafeId],
  );

  useEffect(() => {
    let unsubscribeBookings = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      unsubscribeBookings();
      unsubscribeBookings = () => {};

      if (!currentUser) {
        setBookings([]);
        return;
      }

      const bookingsRef = ref(db, `cafeBookings/${currentUser.uid}`);
      unsubscribeBookings = onValue(
        bookingsRef,
        (snapshot) => {
          const localBookings = loadLocalBookings(currentUser.uid);
          const firebaseBookings = snapshot.exists()
            ? Object.entries(snapshot.val()).map(([id, value]) => ({
                id,
                ...value,
              }))
            : [];

          const merged = [
            ...firebaseBookings,
            ...localBookings.filter(
              (localBooking) =>
                !firebaseBookings.some(
                  (firebaseBooking) =>
                    firebaseBooking.localId === localBooking.localId,
                ),
            ),
          ].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

          setBookings(merged);
        },
        (error) => {
          console.error("Cafe bookings realtime listener error:", error);
          setBookings(
            loadLocalBookings(currentUser.uid).sort(
              (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
            ),
          );
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
    };
  }, []);

  const notify = (text) => {
    setMessage(text);
    window.clearTimeout(window.gvCafeMessageTimer);
    window.gvCafeMessageTimer = window.setTimeout(() => setMessage(""), 3500);
  };

  const filteredCafes = useMemo(() => {
    // Customers only ever browse admin-approved cafés — a newly listed
    // café stays invisible here until it's reviewed.
    const approved = cafes.filter((c) => c.status === "approved");
    const q = search.trim().toLowerCase();
    if (!q) return approved;
    return approved.filter((c) =>
      `${c.name} ${c.address}`.toLowerCase().includes(q),
    );
  }, [cafes, search]);

  const selectCafe = (cafe) => {
    setSelectedCafeId(cafe.id);
    setSelectedSpec(null);
    setSelectedTime("");
    setShowBookings(false);
  };

  const now = new Date(nowMs);
  const isTodaySelected = selectedDate === localISO(now);
  const timeSlots = selectedCafe
    ? getTimeSlots(
        selectedCafe.opening,
        selectedCafe.closing,
        // Today: only slots that start after the current time.
        isTodaySelected ? now.getHours() * 60 + now.getMinutes() : -1,
      )
    : [];

  const totalSeats = selectedCafe?.totalSeats || 0;

  useEffect(() => {
    let cancelled = false;
    const loadSlots = async () => {
      if (!selectedCafe || !selectedDate || !user || timeSlots.length === 0) {
        setSlotAvailability({});
        return;
      }
      setLoadingSlots(true);
      try {
        const next = {};

        await Promise.all(
          timeSlots.map(async (slot) => {
            const key = slot.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            const localCount = localSlotCount(
              selectedCafe.id,
              selectedDate,
              slot,
              user.uid,
            );

            try {
              const snap = await get(
                ref(
                  db,
                  `cafeSlots/${selectedCafe.id}/${selectedDate}/${key}/booked`,
                ),
              );
              next[slot] = Math.min(
                Math.max(Number(snap.val() || 0), localCount),
                totalSeats,
              );
            } catch {
              next[slot] = Math.min(localCount, totalSeats);
            }
          }),
        );

        if (!cancelled) setSlotAvailability(next);
      } catch (error) {
        console.error("Cafe slots load error:", error);
        if (!cancelled) {
          const fallback = {};
          timeSlots.forEach((slot) => {
            fallback[slot] = Math.min(
              localSlotCount(selectedCafe.id, selectedDate, slot, user.uid),
              totalSeats,
            );
          });
          setSlotAvailability(fallback);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [selectedCafe, selectedDate, user, totalSeats]);

  const bookCafe = async () => {
    if (!user) {
      notify("Please login first.");
      return;
    }

    if (!selectedCafe || !selectedDate || !selectedTime) {
      notify("Select a café, date and time slot.");
      return;
    }

    if (selectedDate < todayISO()) {
      notify("Please choose today or a future date.");
      return;
    }

    if (!timeSlots.includes(selectedTime)) {
      setSelectedTime("");
      notify("That slot has already started. Please pick a later one.");
      return;
    }

    if (/online appointment/i.test(selectedCafe.opening)) {
      notify(
        "This café uses online appointment booking. Use its website/contact details.",
      );
      return;
    }

    if (
      isDateBlocked(
        selectedCafe,
        new Date(`${selectedDate}T00:00:00`),
        selectedDate,
      )
    ) {
      notify("The café is closed on that date. Please choose another day.");
      return;
    }

    const locallyBooked = localSlotCount(
      selectedCafe.id,
      selectedDate,
      selectedTime,
      user.uid,
    );

    const currentlyBooked = Math.max(
      Number(slotAvailability[selectedTime] || 0),
      locallyBooked,
    );

    if (currentlyBooked >= totalSeats) {
      notify("That slot is full. Please choose another time.");
      setSlotAvailability((prev) => ({
        ...prev,
        [selectedTime]: totalSeats,
      }));
      return;
    }

    setSaving(true);

    const localId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const pricePerHour = selectedSpec
      ? Number(selectedSpec.price) || selectedCafe.pricePerHour
      : selectedCafe.pricePerHour;

    const bookingBase = {
      localId,
      cafeId: selectedCafe.id,
      cafeName: selectedCafe.name,
      address: selectedCafe.address,
      date: selectedDate,
      time: selectedTime,
      station: `Station ${(locallyBooked % totalSeats) + 1}`,
      specLabel: selectedSpec ? selectedSpec.label : "",
      pricePerHour,
      totalPrice: pricePerHour,
      status: "Pending",
      customerName:
        user.displayName || user.email?.split("@")[0] || "GamingVerse User",
      customerEmail: user.email || "",
      customerPhone: user.phoneNumber || "",
      createdAt: Date.now(),
    };

    try {
      let savedToFirebase = false;

      try {
        const slotRef = ref(
          db,
          `cafeSlots/${selectedCafe.id}/${selectedDate}/${selectedTime
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}`,
        );

        const tx = await runTransaction(slotRef, (current) => {
          const booked = Number(current?.booked || 0);

          if (booked >= totalSeats) return;

          return {
            booked: booked + 1,
            updatedAt: Date.now(),
          };
        });

        if (!tx.committed) {
          notify("That slot is full. Please choose another time.");
          setSlotAvailability((prev) => ({
            ...prev,
            [selectedTime]: totalSeats,
          }));
          return;
        }

        const bookingRef = push(ref(db, `cafeBookings/${user.uid}`));

        await set(bookingRef, {
          ...bookingBase,
          localId,
        });

        const firebaseBooking = {
          id: bookingRef.key,
          ...bookingBase,
        };

        setBookings((prev) => [firebaseBooking, ...prev]);
        savedToFirebase = true;
      } catch (firebaseError) {
        console.warn(
          "Firebase booking write failed; using local booking fallback.",
          firebaseError,
        );
      }

      if (!savedToFirebase) {
        const localBookings = loadLocalBookings(user.uid);
        saveLocalBookings(user.uid, [bookingBase, ...localBookings]);

        setBookings((prev) => [bookingBase, ...prev]);

        notify(
          "✓ Booking request saved on this device. Connect Firebase Database write access to sync across devices.",
        );
      } else {
        notify(
          "✓ Booking request sent to the café owner. Waiting for approval.",
        );
      }

      setSlotAvailability((prev) => ({
        ...prev,
        [selectedTime]: Math.min(
          Number(prev[selectedTime] || 0) + 1,
          totalSeats,
        ),
      }));
    } catch (error) {
      console.error("Cafe booking error:", error);
      notify("Booking failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (booking) => {
    if (!user) return;

    if (
      !window.confirm(
        `Cancel booking at ${booking.cafeName} on ${booking.date} at ${booking.time}?`,
      )
    ) {
      return;
    }

    try {
      if (String(booking.id || "").startsWith("local-")) {
        const nextLocal = loadLocalBookings(user.uid).filter(
          (item) => item.localId !== booking.localId,
        );
        saveLocalBookings(user.uid, nextLocal);
        setBookings((prev) =>
          prev.filter((x) => x.localId !== booking.localId),
        );
        setSlotAvailability((prev) => ({
          ...prev,
          [booking.time]: Math.max(0, Number(prev[booking.time] || 0) - 1),
        }));
        notify("Booking cancelled.");
        return;
      }

      const slotKey = booking.time.replace(/[^a-z0-9]/gi, "_").toLowerCase();

      try {
        const occupied = ["Pending", "Confirmed"].includes(
          String(booking.status || ""),
        );
        if (occupied) {
          await runTransaction(
            ref(db, `cafeSlots/${booking.cafeId}/${booking.date}/${slotKey}`),
            (current) => {
              if (!current) return current;
              const nextBooked = Math.max(0, Number(current.booked || 0) - 1);
              return nextBooked === 0
                ? null
                : {
                    ...current,
                    booked: nextBooked,
                    updatedAt: Date.now(),
                  };
            },
          );
        }

        await remove(ref(db, `cafeBookings/${user.uid}/${booking.id}`));
      } catch (firebaseError) {
        console.warn("Firebase cancellation write failed:", firebaseError);
      }

      const nextLocal = loadLocalBookings(user.uid).filter(
        (item) => item.localId !== booking.localId,
      );
      saveLocalBookings(user.uid, nextLocal);

      setBookings((prev) =>
        prev.filter(
          (x) => x.id !== booking.id && x.localId !== booking.localId,
        ),
      );

      setSlotAvailability((prev) => ({
        ...prev,
        [booking.time]: Math.max(0, Number(prev[booking.time] || 0) - 1),
      }));

      notify("Booking cancelled.");
    } catch (error) {
      console.error("Cancel booking error:", error);
      notify("Could not cancel booking.");
    }
  };

  const cafeStats = {
    stations: cafes.reduce(
      (sum, cafe) => sum + (cafe.specs.length || cafe.totalSeats || 0),
      0,
    ),
    fromPrice: cafes.length
      ? Math.min(...cafes.map((cafe) => Number(cafe.pricePerHour) || 0))
      : 0,
  };

  if (loading)
    return <PageSkeleton variant="grid" />;

  return (
    <div className="cafe-page">
      <header className="cafe-header">
        <div className="cafe-header-title">
          <span>GAMINGVERSE CAFÉS</span>
          <strong>Book gaming sessions near you</strong>
        </div>
        <div className="cafe-header-actions">
          <button
            type="button"
            className="cafe-bookings-btn"
            onClick={() => setShowBookings((v) => !v)}
          >
            📅 My Bookings{bookings.length ? ` (${bookings.length})` : ""}
          </button>
        </div>
      </header>

      <main className="cafe-main gv-page-enter">
        <section className="cafe-hero">
          <div>
            <span>GAMINGVERSE CAFÉ BOOKING</span>
            <h1>
              Book your <b>gaming session.</b>
            </h1>
            <p>
              Discover gaming cafés listed by their owners, choose your date
              and hourly slot, then send a booking request.
            </p>
            <div className="cafe-hero-perks">
              <em>⏱️ Hourly slots</em>
              <em>✅ Owner-confirmed</em>
              <em>🎟️ QR ticket check-in</em>
            </div>
          </div>
          <div className="cafe-hero-side">
            <div className="cafe-hero-stats">
              <div>
                <strong>{cafes.length}</strong>
                <small>Cafés</small>
              </div>
              <div>
                <strong>{cafeStats.stations}</strong>
                <small>Stations</small>
              </div>
              <div>
                <strong>
                  {cafeStats.fromPrice ? `₹${cafeStats.fromPrice}` : "—"}
                </strong>
                <small>From / hr</small>
              </div>
            </div>
          </div>
        </section>

        <section className="cafe-search-bar">
          <label className="cafe-search">
            <span aria-hidden="true">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search café name or address..."
              aria-label="Search cafés"
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
        </section>

        {message && <div className="cafe-message">{message}</div>}

        {showBookings ? (
          <section className="cafe-section-page">
            <div className="cafe-section-title">
              <div>
                <span>YOUR RESERVATIONS</span>
                <h2>My Café Bookings</h2>
              </div>
              <button type="button" onClick={() => setShowBookings(false)}>
                Browse Cafés
              </button>
            </div>
            {bookings.length ? (
              <div className="cafe-bookings-list">
                {bookings.map((b) => {
                  const status = b.status || "Confirmed";
                  const statusText =
                    status === "Pending"
                      ? "Waiting for café approval"
                      : status === "Confirmed"
                        ? "Booking confirmed"
                        : status === "Rejected"
                          ? "Request rejected"
                          : status;
                  const canCancel = ![
                    "Completed",
                    "Cancelled",
                    "Rejected",
                  ].includes(status);
                  return (
                    <article className="cafe-booking-card" key={b.id}>
                      <div>
                        <span
                          className={`booking-status booking-status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                        <h3>{b.cafeName}</h3>
                        <p>
                          📅 {b.date} &nbsp; • &nbsp; 🕐 {b.time} &nbsp; •
                          &nbsp; 🎮 {b.station}
                        </p>
                        <small>{b.address}</small>
                        <small className="booking-owner-note">
                          {statusText}
                        </small>
                      </div>
                      <div>
                        {cafes.find((c) => c.id === b.cafeId)?.mapUrl && (
                          <a
                            href={cafes.find((c) => c.id === b.cafeId).mapUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Map ↗
                          </a>
                        )}
                        {(status === "Confirmed" || status === "Completed") &&
                          !String(b.id || "").startsWith("local-") && (
                            <button
                              type="button"
                              className={`show-ticket${status === "Completed" ? " is-used" : ""}`}
                              onClick={() => setQrBooking(b)}
                            >
                              🎫 {status === "Completed" ? "View Ticket" : "View QR Ticket"}
                            </button>
                          )}
                        {status === "Pending" && (
                          <span className="ticket-pending">
                            🎫 QR ticket unlocks once the café confirms
                          </span>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            className="cancel-booking"
                            onClick={() => cancelBooking(b)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="cafe-empty">
                <div>📅</div>
                <h3>No bookings yet</h3>
                <p>Pick a café and request your first gaming session.</p>
              </div>
            )}
          </section>
        ) : selectedCafe ? (
          <section className="cafe-booking-view">
            <button
              className="cafe-back"
              type="button"
              onClick={() => setSelectedCafeId(null)}
            >
              ← Back to cafés
            </button>
            <div className="cafe-detail-grid">
              <div className="cafe-detail-card">
                {selectedCafe.photos.length > 0 ? (
                  <div className="cafe-photo-gallery">
                    {selectedCafe.photos.slice(0, 4).map((url, i) => (
                      <img
                        key={url + i}
                        src={url}
                        alt={`${selectedCafe.name} photo ${i + 1}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="cafe-cover-icon">🎮</div>
                )}
                <h2>{selectedCafe.name}</h2>
                <p>📍 {selectedCafe.address}</p>
                {selectedCafe.about && (
                  <p className="cafe-about-text">{selectedCafe.about}</p>
                )}
                <div className="cafe-info-pills">
                  <span>
                    🕘 {selectedCafe.opening} – {selectedCafe.closing}
                  </span>
                  <span>🎮 {totalSeats} gaming stations</span>
                  <span>₹{selectedCafe.pricePerHour}/hr</span>
                </div>
                <div className="cafe-links">
                  {selectedCafe.website && (
                    <a
                      href={selectedCafe.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Official / Info ↗
                    </a>
                  )}
                  {selectedCafe.mapUrl && (
                    <a
                      href={selectedCafe.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Google Maps ↗
                    </a>
                  )}
                  {selectedCafe.phone && (
                    <a href={`tel:${selectedCafe.phone}`}>Call</a>
                  )}
                </div>
              </div>
              <div className="cafe-slot-card">
                {selectedCafe.specs.length > 0 && (
                  <>
                    <span className="cafe-step">STEP 1</span>
                    <h2>Choose your setup</h2>
                    <div className="cafe-spec-list">
                      {selectedCafe.specs.map((spec) => (
                        <button
                          key={spec.id}
                          type="button"
                          className={`cafe-spec-card ${selectedSpec?.id === spec.id ? "selected" : ""}`}
                          onClick={() => setSelectedSpec(spec)}
                        >
                          <strong>{spec.label || spec.type}</strong>
                          {spec.details && <small>{spec.details}</small>}
                          <span>₹{spec.price}/hr</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <span className="cafe-step">
                  {selectedCafe.specs.length > 0 ? "STEP 2" : "STEP 1"}
                </span>
                <h2>Choose date & hourly slot</h2>
                <div className="cafe-date-chips">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    const blocked = isDateBlocked(selectedCafe, d, iso);
                    const selected = selectedDate === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`cafe-date-chip ${selected ? "selected" : ""} ${blocked ? "blocked" : ""}`}
                        disabled={blocked}
                        onClick={() => {
                          setSelectedDate(iso);
                          setSelectedTime("");
                        }}
                      >
                        <strong>
                          {i === 0
                            ? "Today"
                            : d.toLocaleDateString("en-US", { weekday: "short" })}
                        </strong>
                        <span>{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                {/online appointment/i.test(selectedCafe.opening) ? null : (
                  <>
                    <div className="slot-header">
                      <span>Available hourly slots</span>
                      <small>
                        {loadingSlots
                          ? "Checking availability..."
                          : `${totalSeats} stations per slot`}
                      </small>
                    </div>
                    {timeSlots.length === 0 && (
                      <div className="slots-empty">
                        <strong>
                          {isTodaySelected
                            ? "No more slots today"
                            : "No slots on this day"}
                        </strong>
                        <small>
                          {isTodaySelected
                            ? "Today's sessions have all started — pick another date above."
                            : "Please pick another date above."}
                        </small>
                      </div>
                    )}
                    <div className="slots-grid">
                      {timeSlots.map((slot) => {
                        const booked = Number(slotAvailability[slot] || 0);
                        const full = booked >= totalSeats;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`time-slot ${selectedTime === slot ? "selected" : ""} ${full ? "full" : ""}`}
                            disabled={full || loadingSlots}
                            onClick={() => setSelectedTime(slot)}
                          >
                            <strong>{slot}</strong>
                            <small>
                              {full
                                ? "Full"
                                : `${totalSeats - booked} available`}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="confirm-booking"
                      type="button"
                      disabled={!selectedTime || saving || loadingSlots}
                      onClick={bookCafe}
                    >
                      {saving
                        ? "Sending Request..."
                        : selectedTime
                          ? `Request ${selectedTime} Booking • ₹${selectedSpec ? selectedSpec.price : selectedCafe.pricePerHour}/hr`
                          : "Select a Time Slot"}
                    </button>
                  </>
                )}
                {/online appointment/i.test(selectedCafe.opening) && (
                  <div className="online-appointment">
                    <strong>Online appointment</strong>
                    <p>
                      This café hasn't published fixed hours. Check their
                      contact details below.
                    </p>
                    {selectedCafe.website && (
                      <a
                        href={selectedCafe.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open appointment/info page ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="cafe-section-page">
            <div className="cafe-section-title">
              <div>
                <span>DISCOVER</span>
                <h2>Gaming Cafés</h2>
                <p>
                  <b>{filteredCafes.length}</b> café
                  {filteredCafes.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>
            <div className="cafe-grid">
              {filteredCafes.map((cafe) => (
                <article
                  className="cafe-card"
                  key={cafe.id}
                  onClick={() => selectCafe(cafe)}
                >
                  <div className="cafe-card-image">
                    {cafe.photos[0] ? (
                      <img src={cafe.photos[0]} alt={cafe.name} />
                    ) : (
                      <div>🎮</div>
                    )}
                    <span className="cafe-card-price">
                      ₹{cafe.pricePerHour}
                      <small>/hr</small>
                    </span>
                    {cafe.photos.length > 1 && (
                      <span className="cafe-card-photos">
                        📷 {cafe.photos.length}
                      </span>
                    )}
                  </div>
                  <div className="cafe-card-content">
                    <small>GAMING CAFÉ</small>
                    <h3>{cafe.name}</h3>
                    <p>📍 {cafe.address || "Address coming soon"}</p>
                    <div className="cafe-card-meta">
                      <span>
                        🕘 {cafe.opening} – {cafe.closing}
                      </span>
                      <span>
                        🎮{" "}
                        {cafe.specs.length
                          ? `${cafe.specs.length} station types`
                          : `${cafe.totalSeats} seats`}
                      </span>
                    </div>
                    <div className="cafe-card-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCafe(cafe);
                        }}
                      >
                        📅 Book a Slot
                      </button>
                      {cafe.mapUrl && (
                        <a
                          href={cafe.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🗺️ Map
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!filteredCafes.length && (
              <div className="cafe-empty">
                <div>🔎</div>
                <h3>No cafés listed yet</h3>
                <p>
                  Café owners haven't added a café here yet — check back soon,
                  or sign up as a business owner to list yours.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {qrBooking && user && (
        <CafeQrModal
          booking={qrBooking}
          uid={user.uid}
          onClose={() => setQrBooking(null)}
        />
      )}
    </div>
  );
}
