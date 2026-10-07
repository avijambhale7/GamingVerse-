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
import useEscapeKey from "../../../utils/useEscapeKey.js";

export default function CafeQrModal({ booking, uid, onClose }) {
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEscapeKey(onClose);
  // Typed in by the café owner when their camera can't scan the QR.
  const ticketCode = encodeTicket(uid, booking.id);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticketCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(ticketCode, {
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
  }, [ticketCode]);

  return (
    <div className="cafe-qr-backdrop" onClick={onClose}>
      <div
        className="cafe-qr-modal"
        role="dialog"
        aria-label={`${booking.cafeName} ticket`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="cafe-qr-close"
          type="button"
          onClick={onClose}
          aria-label="Close ticket"
        >
          ×
        </button>
        <h3>{booking.cafeName}</h3>
        <p>
          {booking.date} • {booking.time}
        </p>
        <div
          className={`cafe-qr-image${
            booking.status === "Completed" ? " is-used" : ""
          }`}
        >
          {dataUrl ? (
            <img src={dataUrl} alt="Booking QR ticket" />
          ) : (
            <span>Generating...</span>
          )}
          {booking.status === "Completed" && (
            <em className="cafe-qr-used">✓ Checked in</em>
          )}
        </div>
        <small>
          {booking.status === "Completed"
            ? "This session is complete — the ticket has been used."
            : "Show this to the café owner at check-in."}
        </small>
        {booking.status !== "Completed" && (
          <div className="cafe-qr-code">
            <span>Ticket code (if the QR won&apos;t scan)</span>
            <div>
              <code>{ticketCode}</code>
              <button type="button" onClick={copyCode}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
