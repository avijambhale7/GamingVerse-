/* =========================================================
   CAFÉ NO-SHOWS (pure — unit tested in noShow.test.js)
   A confirmed booking whose hour has fully passed (India time)
   can be marked "No-show" by the café's owner. Owners see how
   many no-shows a customer has had at their café.
========================================================= */

import { indiaMoment } from "./indiaTime.js";
import { parseTime } from "./time.js";

export const NO_SHOW = "No-show";
const SLOT_MS = 60 * 60 * 1000; // bookings are hourly slots

// When the booked hour ends (ms), or NaN if the date/time can't be read.
export function bookingEndsAt(booking) {
  const minutes = parseTime(booking?.time);
  if (minutes == null) return NaN;
  return indiaMoment(booking?.date, minutes) + SLOT_MS;
}

// Only confirmed bookings whose hour is over can become a no-show.
export function canMarkNoShow(booking, nowMs = Date.now()) {
  if (String(booking?.status || "") !== "Confirmed") return false;
  const end = bookingEndsAt(booking);
  return Number.isFinite(end) && nowMs >= end;
}

// How many no-shows this customer has had at this café.
export function noShowCount(bookings = [], customerId, cafeId) {
  if (!customerId || !cafeId) return 0;
  return (Array.isArray(bookings) ? bookings : []).filter(
    (b) =>
      b?.customerId === customerId &&
      b?.cafeId === cafeId &&
      String(b?.status || "") === NO_SHOW,
  ).length;
}
