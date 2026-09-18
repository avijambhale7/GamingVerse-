/* =========================================================
   LOCAL BOOKING STORE
   Mirrors confirmed bookings in localStorage so slot counts
   stay correct while the device is offline.
========================================================= */

export function localBookingKey(uid) {
  return `gamingverse_cafe_bookings_${uid}`;
}

export function loadLocalBookings(uid) {
  try {
    const data = JSON.parse(localStorage.getItem(localBookingKey(uid)) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveLocalBookings(uid, bookings) {
  localStorage.setItem(localBookingKey(uid), JSON.stringify(bookings));
}

export function localSlotCount(cafeId, date, time, uid) {
  const bookings = loadLocalBookings(uid);
  return bookings.filter(
    (b) =>
      b.cafeId === cafeId &&
      b.date === date &&
      b.time === time &&
      !["Rejected", "Cancelled", "Completed"].includes(
        String(b.status || "Confirmed"),
      ),
  ).length;
}
