/* =========================================================
   CAFÉ SLOT SEATS
   cafeSlots/{cafeId}/{date}/{slotKey}.booked counts *seats*
   taken in an hourly slot. A booking can hold several seats
   (group booking); older bookings without a `seats` field
   count as one seat. Seat counts only ever change together
   with their booking — see ./bookingWrites.js.
========================================================= */

export const MAX_SEATS_PER_BOOKING = 4;

// "11:00 AM" -> "11_00_am" (the database rules derive the same key).
export function slotKey(time) {
  return String(time || "")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

export function bookingSeats(booking) {
  return Math.max(1, Number(booking?.seats) || 1);
}

// "Station 3" for one seat, "Stations 3–5" for a group.
export function stationLabel(firstIndex, seats, capacity) {
  const first = (firstIndex % Math.max(capacity, 1)) + 1;
  if (seats <= 1) return `Station ${first}`;
  const last = Math.min(first + seats - 1, capacity);
  return `Stations ${first}–${last}`;
}
