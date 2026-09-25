/* =========================================================
   CAFÉ SLOT SEATS
   cafeSlots/{cafeId}/{date}/{slotKey}.booked counts *seats*
   taken in an hourly slot. A booking can hold several seats
   (group booking), so every reserve/release moves the counter
   by that booking's seat count. Older bookings without a
   `seats` field count as one seat.
========================================================= */

import { ref, runTransaction } from "firebase/database";
import { db } from "../../../firebase";

export const MAX_SEATS_PER_BOOKING = 4;

export function slotKey(time) {
  return String(time || "")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

export function bookingSeats(booking) {
  return Math.max(1, Number(booking?.seats) || 1);
}

// Atomically take `seats` seats; fails (committed = false) if that would
// go over the café's capacity.
export async function reserveSeats(cafeId, date, time, seats, capacity) {
  const tx = await runTransaction(
    ref(db, `cafeSlots/${cafeId}/${date}/${slotKey(time)}`),
    (current) => {
      const booked = Number(current?.booked || 0);
      if (booked + seats > capacity) return undefined;
      return { booked: booked + seats, updatedAt: Date.now() };
    },
  );
  return tx.committed;
}

export async function releaseSeats(cafeId, date, time, seats) {
  await runTransaction(
    ref(db, `cafeSlots/${cafeId}/${date}/${slotKey(time)}`),
    (current) => {
      if (!current) return current;
      const booked = Math.max(0, Number(current.booked || 0) - seats);
      return booked === 0
        ? null
        : { ...current, booked, updatedAt: Date.now() };
    },
  );
}

// "Station 3" for one seat, "Stations 3–5" for a group.
export function stationLabel(firstIndex, seats, capacity) {
  const first = (firstIndex % Math.max(capacity, 1)) + 1;
  if (seats <= 1) return `Station ${first}`;
  const last = Math.min(first + seats - 1, capacity);
  return `Stations ${first}–${last}`;
}
