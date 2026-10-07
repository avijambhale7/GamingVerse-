/* =========================================================
   BOOKING TICKET ENCODING
   The QR payload is just "uid|bookingId" so the owner's
   scanner can look the booking up directly at
   cafeBookings/{uid}/{bookingId}.
========================================================= */

export function encodeTicket(uid, bookingId) {
  return `${uid}|${bookingId}`;
}

// Also used for codes typed or pasted by hand, so surrounding spaces and
// line breaks are ignored. Firebase ids never contain whitespace.
export function decodeTicket(text) {
  const parts = String(text || "").replace(/\s+/g, "").split("|");
  const [uid, bookingId] = parts;
  if (parts.length !== 2 || !uid || !bookingId) return null;
  return { uid, bookingId };
}
