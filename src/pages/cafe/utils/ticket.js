/* =========================================================
   BOOKING TICKET ENCODING
   The QR payload is just "uid|bookingId" so the owner's
   scanner can look the booking up directly at
   cafeBookings/{uid}/{bookingId}.
========================================================= */

export function encodeTicket(uid, bookingId) {
  return `${uid}|${bookingId}`;
}

export function decodeTicket(text) {
  const [uid, bookingId] = String(text || "").split("|");
  if (!uid || !bookingId) return null;
  return { uid, bookingId };
}
