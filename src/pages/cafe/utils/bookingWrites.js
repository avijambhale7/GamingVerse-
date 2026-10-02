/* =========================================================
   BOOKING WRITES
   A booking lives at cafeBookings/{customerUid}/{bookingId};
   cafeBookingIndex/{cafeId}/{bookingId} lets the café's owner
   list it; cafeSlots/{cafeId}/{date}/{slotKey}.booked counts
   the seats held in that hour (owner/admin only), mirrored as a
   plain number in cafeAvailability/... for everyone to read.

   How a change is saved (compare-and-set, enforced by the rules):
   1. read the booking and the seat count,
   2. work out the new count,
   3. write booking + slot + public count in ONE multi-path update.
   The rules accept step 3 only if the new count equals the count
   stored *at that moment* plus/minus this booking's seats, and the
   slot write names the booking being changed (lastCustomer /
   lastBooking — set on every write, so it is always "this booking",
   never "the newest booking"). If anyone changed the booking or the
   slot between 1 and 3, the write is refused and we start again
   from step 1 with fresh data. Two people can never both win with
   the same stale count.
========================================================= */
import { get, push, ref, update } from "firebase/database";
import { db } from "../../../firebase";
import { bookingSeats, slotKey } from "./slots.js";

const OCCUPYING = new Set(["Pending", "Confirmed"]);
const heldSeats = (booking) =>
  booking && OCCUPYING.has(String(booking.status || "")) ? bookingSeats(booking) : 0;
const slotSuffix = (b) => `${b.cafeId}/${b.date}/${slotKey(b.time)}`;
const ATTEMPTS = 5;

export class SlotFullError extends Error {
  constructor() {
    super("Not enough seats left in that slot.");
    this.name = "SlotFullError";
  }
}

/* One compare-and-set attempt loop.
   `load()` returns the booking as stored now (null if none);
   `change(before)` returns { after, extra } or null to stop. */
async function commit({ customerUid, bookingId, load, change, capacity = Infinity }) {
  let lastError;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const before = await load();
    const plan = change(before);
    if (!plan) return;
    const { after, extra = {} } = plan;
    const delta = heldSeats(after) - heldSeats(before);
    const updates = {
      [`cafeBookings/${customerUid}/${bookingId}`]: after || null,
      ...extra,
    };
    if (delta !== 0) {
      const suffix = slotSuffix(after || before);
      const current = Number(
        (await get(ref(db, `cafeAvailability/${suffix}`))).val() || 0,
      );
      const next = Math.max(0, current + delta);
      if (delta > 0 && next > capacity) throw new SlotFullError();
      updates[`cafeSlots/${suffix}`] = {
        booked: next,
        lastCustomer: customerUid,
        lastBooking: bookingId,
        updatedAt: Date.now(),
      };
      // The public seat count must match (the rules check this).
      updates[`cafeAvailability/${suffix}`] = next;
    }
    try {
      await update(ref(db), updates);
      return;
    } catch (error) {
      lastError = error; // stale booking or count — reload and retry
    }
  }
  throw lastError;
}

const loadBooking = (customerUid, bookingId) => async () => {
  const snap = await get(ref(db, `cafeBookings/${customerUid}/${bookingId}`));
  return snap.exists() ? snap.val() : null;
};

/* New booking + index + seats. Returns the booking id.
   `capacity` is the café's seat count (owners pass Infinity). */
export async function createBooking(customerUid, booking, { capacity = Infinity } = {}) {
  const bookingId = push(ref(db, `cafeBookings/${customerUid}`)).key;
  await commit({
    customerUid,
    bookingId,
    capacity,
    load: async () => null,
    change: () => ({
      after: booking,
      extra: {
        [`cafeBookingIndex/${booking.cafeId}/${bookingId}`]: { customerId: customerUid },
      },
    }),
  });
  return bookingId;
}

/* Cancels: removes the booking + index and frees its seats, together.
   The booking is re-read on every attempt, so a change made in the
   meantime (e.g. the owner rejected it) is taken into account. */
export async function deleteBooking(customerUid, booking) {
  await commit({
    customerUid,
    bookingId: booking.id,
    load: loadBooking(customerUid, booking.id),
    change: (before) =>
      before && {
        after: null,
        extra: before.cafeId
          ? { [`cafeBookingIndex/${before.cafeId}/${booking.id}`]: null }
          : {},
      },
  });
}

/* Owner status change (Confirmed / Rejected / Completed / Cancelled):
   the booking and its seats move together. Owners may overbook. */
export async function changeBookingStatus(customerUid, bookingId, changes) {
  let missing = false;
  await commit({
    customerUid,
    bookingId,
    load: loadBooking(customerUid, bookingId),
    change: (before) => {
      if (!before) {
        missing = true;
        return null;
      }
      return { after: { ...before, ...changes } };
    },
  });
  if (missing) throw new Error("This booking no longer exists.");
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
