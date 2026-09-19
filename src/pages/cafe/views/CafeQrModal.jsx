/* =========================================================
   CAFE QR MODAL
   Renders a booking as a scannable ticket. The café owner's
   "Scan Ticket" tool (OwnerDashboard) decodes the same
   "uid|bookingId" string to look the booking up and check
   the customer in.
========================================================= */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { encodeTicket } from "../utils/ticket.js";

export default function CafeQrModal({ booking, uid, onClose }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(encodeTicket(uid, booking.id), {
      width: 240,
      margin: 1,
      color: { dark: "#0b0b10", light: "#f5f5f7" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((error) => console.error("QR generation error:", error));
    return () => {
      cancelled = true;
    };
  }, [uid, booking.id]);

  return (
    <div className="cafe-qr-backdrop" onClick={onClose}>
      <div className="cafe-qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cafe-qr-close" type="button" onClick={onClose}>
          ×
        </button>
        <h3>{booking.cafeName}</h3>
        <p>
          {booking.date} • {booking.time}
        </p>
        <div className="cafe-qr-image">
          {dataUrl ? (
            <img src={dataUrl} alt="Booking QR ticket" />
          ) : (
            <span>Generating...</span>
          )}
        </div>
        <small>Show this to the café owner at check-in.</small>
      </div>
    </div>
  );
}
