/* =========================================================
   BOOKING WRITES
   A booking lives at cafeBookings/{customerUid}/{bookingId};
   cafeBookingIndex/{cafeId}/{bookingId} lets the café's owner
   list it; cafeSlots/{cafeId}/{date}/{slotKey}.booked counts
   the seats held in that hour.

   All three change in ONE atomic write. The database rules only
   accept a seat change that names the booking it belongs to
   (lastCustomer / lastBooking) and moves the count by exactly
   that booking's seats — so seats can't be faked, and a booking
   can't exist without its seats (or vice versa).

   If someone else changed the same slot a moment earlier the
   write is rejected; it is retried with the fresh count.
========================================================= */
import { get, push, ref, update } from "firebase/database";
import { db } from "../../../firebase";
import { bookingSeats, slotKey } from "./slots.js";

const OCCUPYING = new Set(["Pending", "Confirmed"]);
const heldSeats = (booking) =>
  booking && OCCUPYING.has(String(booking.status || "")) ? bookingSeats(booking) : 0;
const slotPath = (b) => `cafeSlots/${b.cafeId}/${b.date}/${slotKey(b.time)}`;

export class SlotFullError extends Error {
  constructor() {
    super("Not enough seats left in that slot.");
    this.name = "SlotFullError";
  }
}

/* Writes the booking change (before → after) plus its seat change. */
async function commit({ customerUid, bookingId, before, after, extra = {}, capacity = Infinity }) {
  const target = after || before;
  const delta = heldSeats(after) - heldSeats(before);
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const updates = {
      [`cafeBookings/${customerUid}/${bookingId}`]: after || null,
      ...extra,
    };
    if (delta !== 0) {
      const path = slotPath(target);
      const current = Number((await get(ref(db, `${path}/booked`))).val() || 0);
      const next = Math.max(0, current + delta);
      if (delta > 0 && next > capacity) throw new SlotFullError();
      updates[path] = {
        booked: next,
        lastCustomer: customerUid,
        lastBooking: bookingId,
        updatedAt: Date.now(),
      };
    }
    try {
      await update(ref(db), updates);
      return;
    } catch (error) {
      lastError = error;
      if (delta === 0) break; // no seat race to retry
    }
  }
  throw lastError;
}

/* New booking + index + seats. Returns the booking id.
   `capacity` is the café's seat count (owners pass Infinity). */
export async function createBooking(customerUid, booking, { capacity = Infinity } = {}) {
  const bookingId = push(ref(db, `cafeBookings/${customerUid}`)).key;
  await commit({
    customerUid,
    bookingId,
    before: null,
    after: booking,
    capacity,
    extra: {
      [`cafeBookingIndex/${booking.cafeId}/${bookingId}`]: { customerId: customerUid },
    },
  });
  return bookingId;
}

/* Cancels: removes the booking + index and frees its seats, together. */
export async function deleteBooking(customerUid, booking) {
  const snap = await get(ref(db, `cafeBookings/${customerUid}/${booking.id}`));
  if (!snap.exists()) return;
  const before = snap.val();
  await commit({
    customerUid,
    bookingId: booking.id,
    before,
    after: null,
    extra: before.cafeId
      ? { [`cafeBookingIndex/${before.cafeId}/${booking.id}`]: null }
      : {},
  });
}

/* Owner status change (Confirmed / Rejected / Completed / Cancelled):
   the booking and its seats move together. Owners may overbook. */
export async function changeBookingStatus(customerUid, bookingId, changes) {
  const snap = await get(ref(db, `cafeBookings/${customerUid}/${bookingId}`));
  if (!snap.exists()) throw new Error("This booking no longer exists.");
  const before = snap.val();
  await commit({ customerUid, bookingId, before, after: { ...before, ...changes } });
}

/* Adds index entries for bookings saved before the index existed.
   Writing an entry that is already there changes nothing. */
export async function indexBookings(customerUid, bookings) {
  const updates = {};
  bookings.forEach((booking) => {
    if (booking?.id && booking.cafeId && !String(booking.id).startsWith("local-")) {
      updates[`cafeBookingIndex/${booking.cafeId}/${booking.id}`] = {
        customerId: customerUid,
      };
    }
  });
  if (Object.keys(updates).length) await update(ref(db), updates);
}
