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

export function weekdayAbbrev(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function isDateBlocked(cafe, dateObj, dateISO) {
  if (cafe.closedDays.includes(weekdayAbbrev(dateObj))) return true;
  return cafe.blockedDates.includes(dateISO);
}
