/* =========================================================
   useOwnerBookings
   Live bookings for the cafés an owner manages.
   - Site-wide owners/admins: read cafeBookings directly.
   - Café owners: cafeBookingIndex/{cafeId} lists each booking's
     customer; each booking is then read on its own. The rules
     only allow this for cafés whose ownerUid is this owner, so
     no other café's customers are ever downloaded.
   Returns bookings newest first, each with id + customerId.
========================================================= */
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebase";

export default function useOwnerBookings({ enabled, superOwner, cafeIds, onError }) {
  const [byKey, setByKey] = useState({});
  const cafeKey = [...cafeIds].sort().join(",");

  // Site-wide owner: everything (allowed by the rules for that role).
  useEffect(() => {
    if (!enabled || !superOwner) return undefined;
    return onValue(
      ref(db, "cafeBookings"),
      (snapshot) => {
        const next = {};
        Object.entries(snapshot.val() || {}).forEach(([customerId, list]) => {
          Object.entries(list || {}).forEach(([id, booking]) => {
            next[`${customerId}/${id}`] = { id, customerId, ...booking };
          });
        });
        setByKey(next);
      },
      onError,
    );
  }, [enabled, superOwner, onError]);

  // Café owner: index per café, then one listener per booking.
  useEffect(() => {
    if (!enabled || superOwner || !cafeKey) return undefined;
    const dropKey = (key) =>
      setByKey((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    const perCafe = new Map(); // cafeId -> Map(bookingKey -> stop)

    const indexStops = cafeKey.split(",").map((cafeId) => {
      const stops = new Map();
      perCafe.set(cafeId, stops);
      return onValue(
        ref(db, `cafeBookingIndex/${cafeId}`),
        (snapshot) => {
          const live = new Set();
          Object.entries(snapshot.val() || {}).forEach(([id, entry]) => {
            const key = `${entry.customerId}/${id}`;
            live.add(key);
            if (stops.has(key)) return;
            stops.set(
              key,
              onValue(
                ref(db, `cafeBookings/${key}`),
                (snap) => {
                  if (!snap.exists()) return dropKey(key);
                  setByKey((previous) => ({
                    ...previous,
                    [key]: { id, customerId: entry.customerId, ...snap.val() },
                  }));
                },
                (error) => console.warn("Booking read error:", key, error),
              ),
            );
          });
          // Stop listening to bookings that left this café's index.
          stops.forEach((stop, key) => {
            if (live.has(key)) return;
            stop();
            stops.delete(key);
            dropKey(key);
          });
        },
        onError,
      );
    });

    return () => {
      indexStops.forEach((stop) => stop());
      perCafe.forEach((stops) => stops.forEach((stop) => stop()));
    };
  }, [enabled, superOwner, cafeKey, onError]);

  return useMemo(
    () =>
      Object.values(byKey).sort(
        (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
      ),
    [byKey],
  );
}
