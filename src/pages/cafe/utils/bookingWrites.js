/* =========================================================
   BOOKING WRITES
   A booking lives at cafeBookings/{customerUid}/{bookingId}.
   cafeBookingIndex/{cafeId}/{bookingId} = { customerId } lets a
   café owner list *only their own café's* bookings — the
   database rules no longer let owners read every booking.
   Both are always written (and removed) in one atomic update.
========================================================= */
import { push, ref, update } from "firebase/database";
import { db } from "../../../firebase";

/* Creates the booking + its index entry together. Returns the new id. */
export async function createBooking(customerUid, booking) {
  const bookingId = push(ref(db, `cafeBookings/${customerUid}`)).key;
  await update(ref(db), {
    [`cafeBookings/${customerUid}/${bookingId}`]: booking,
    [`cafeBookingIndex/${booking.cafeId}/${bookingId}`]: {
      customerId: customerUid,
    },
  });
  return bookingId;
}

/* Removes the booking + its index entry together. */
export async function deleteBooking(customerUid, booking) {
  await update(ref(db), {
    [`cafeBookings/${customerUid}/${booking.id}`]: null,
    ...(booking.cafeId
      ? { [`cafeBookingIndex/${booking.cafeId}/${booking.id}`]: null }
      : {}),
  });
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
