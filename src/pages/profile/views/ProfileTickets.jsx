/* =========================================================
   PROFILE TICKETS
   The gamer's café booking tickets, live from
   cafeBookings/{uid}. Confirmed and completed bookings open
   the same QR ticket the café owner scans at check-in.
   Rendered by ./ProfileView.jsx under the "Tickets" tab.
========================================================= */

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../../firebase";
import CafeQrModal from "../../cafe/views/CafeQrModal.jsx";
import "../../cafe/styles/qr.css";

// Usable tickets first, then waiting ones, then history.
const STATUS_ORDER = {
  Confirmed: 0,
  Pending: 1,
  Completed: 2,
  Cancelled: 3,
  Rejected: 3,
};

const STATUS_NOTE = {
  Confirmed: "Ready — show the QR at the café",
  Pending: "QR unlocks once the café confirms",
  Completed: "Checked in — ticket used",
  Cancelled: "Booking cancelled",
  Rejected: "Request rejected by the café",
};

export default function ProfileTickets({ navigate, uid }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrBooking, setQrBooking] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;

    return onValue(
      ref(db, `cafeBookings/${uid}`),
      (snapshot) => {
        const list = snapshot.exists()
          ? Object.entries(snapshot.val())
              .map(([id, value]) => ({ id, ...value }))
              // Walk-ins an owner logs are stored under the owner's
              // uid; they aren't the owner's own tickets.
              .filter((booking) => !booking.walkIn)
          : [];

        list.sort(
          (a, b) =>
            (STATUS_ORDER[a.status || "Confirmed"] ?? 4) -
              (STATUS_ORDER[b.status || "Confirmed"] ?? 4) ||
            Number(b.createdAt || 0) - Number(a.createdAt || 0),
        );
        setBookings(list);
        setLoading(false);
      },
      (error) => {
        console.error("Tickets load error:", error);
        setLoading(false);
      },
    );
  }, [uid]);

  if (loading) {
    return <div className="profile-tickets-empty">Loading tickets…</div>;
  }

  if (!bookings.length) {
    return (
      <div className="profile-tickets-empty">
        <div>🎫</div>
        <h3>No tickets yet</h3>
        <p>Book a gaming session at a café and your QR ticket shows up here.</p>
        <button type="button" onClick={() => navigate("/games?view=cafe")}>
          ☕ Find a café
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="profile-tickets">
        {bookings.map((b) => {
          const status = b.status || "Confirmed";
          const hasQr = status === "Confirmed" || status === "Completed";
          const seats = Number(b.seats) || 1;

          return (
            <article
              className={`profile-ticket is-${status.toLowerCase()}`}
              key={b.id}
            >
              <div className="profile-ticket-main">
                <span className="profile-ticket-status">{status}</span>
                <h3>{b.cafeName || "Gaming café"}</h3>
                <p>
                  📅 {b.date} &nbsp;•&nbsp; 🕐 {b.time}
                </p>
                <p>
                  🎮 {b.station || "Station"}
                  {seats > 1 ? ` • ${seats} seats` : ""}
                </p>
                <small>{STATUS_NOTE[status] || status}</small>
              </div>

              <div className="profile-ticket-stub">
                {hasQr ? (
                  <button type="button" onClick={() => setQrBooking(b)}>
                    <span aria-hidden="true">▦</span>
                    {status === "Completed" ? "View" : "Show QR"}
                  </button>
                ) : (
                  <span aria-hidden="true">
                    {status === "Pending" ? "⏳" : "✕"}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {qrBooking && (
        <CafeQrModal
          booking={qrBooking}
          uid={uid}
          onClose={() => setQrBooking(null)}
        />
      )}
    </>
  );
}
