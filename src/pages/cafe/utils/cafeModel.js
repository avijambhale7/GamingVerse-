import { parseTime } from "./time.js";
import { indiaDateISO, indiaMinutesNow, weekdayOfISO } from "./indiaTime.js";

/* =========================================================
   CAFE MODEL
   Cafés are entirely owner-created and live at cafes/{id} in
   the Realtime Database — there is no seed/demo directory.
   This normalizes a raw café record (which may be missing
   optional fields while an owner is still filling it in)
   into a shape the rest of the café UI can rely on.
========================================================= */

export const DEFAULT_TOTAL_SEATS = 6;
export const DEFAULT_PRICE_PER_HOUR = 80;

export function normalizeCafe(id, raw) {
  if (!raw) return null;

  const specs = raw.specs
    ? Object.entries(raw.specs).map(([specId, spec]) => ({
        id: specId,
        ...spec,
      }))
    : [];

  return {
    id,
    name: raw.name || "Gaming Café",
    address: raw.address || "",
    phone: raw.phone || "",
    email: raw.email || "",
    opening: raw.opening || "10:00 AM",
    closing: raw.closing || "10:00 PM",
    website: raw.website || "",
    mapUrl: raw.mapUrl || "",
    about: raw.about || "",
    photos: Array.isArray(raw.photos) ? raw.photos.filter(Boolean) : [],
    totalSeats:
      Number(raw.totalSeats) > 0 ? Number(raw.totalSeats) : DEFAULT_TOTAL_SEATS,
    pricePerHour:
      Number(raw.pricePerHour) > 0
        ? Number(raw.pricePerHour)
        : DEFAULT_PRICE_PER_HOUR,
    specs,
    closedDays: Array.isArray(raw.closedDays) ? raw.closedDays : [],
    blockedDates: Array.isArray(raw.blockedDates) ? raw.blockedDates : [],
    ownerUid: raw.ownerUid || "",
    createdAt: Number(raw.createdAt) || 0,
    // A newly listed café isn't shown to customers until an admin
    // approves it — stops anyone from listing a café they don't run.
    status: raw.status === "approved" || raw.status === "rejected"
      ? raw.status
      : "pending",
  };
}

// Closed weekday or blocked date. Takes the calendar date ("YYYY-MM-DD");
// its weekday doesn't depend on the device's timezone.
export function isDateBlocked(cafe, dateISO) {
  if (cafe.closedDays.includes(weekdayOfISO(dateISO))) return true;
  return cafe.blockedDates.includes(dateISO);
}

// Live "open right now?" for a café. Returns true / false, or null when
// the hours can't be judged (online-appointment cafés, unparseable
// times) so the UI can simply show no badge. Handles closed weekdays,
// blocked dates, 24-hour cafés and hours that run past midnight.
export function isCafeOpenNow(cafe, now = new Date()) {
  if (!cafe || /online appointment/i.test(cafe.opening)) return null;

  // India time, whatever the device's timezone.
  const nowMs = now.getTime();
  const iso = indiaDateISO(nowMs);
  if (isDateBlocked(cafe, iso)) return false;
  if (/24\s*hours/i.test(cafe.opening)) return true;

  const open = parseTime(cafe.opening);
  const close = parseTime(cafe.closing);
  if (open == null || close == null) return null;

  const minutes = indiaMinutesNow(nowMs);
  // Same-day hours (10 AM–10 PM) vs overnight hours (6 PM–2 AM).
  return close > open
    ? minutes >= open && minutes < close
    : minutes >= open || minutes < close;
}
