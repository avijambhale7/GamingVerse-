/* =========================================================
   WALK-IN BOOKING (owner)
   Lets a café owner log a customer who turned up in person so
   the slot's seats are counted and online customers can't
   double-book them. Saved as an already-confirmed booking
   under the owner's uid with `walkIn: true`.
   Rendered by ../../OwnerDashboard.jsx (Café → Bookings).
========================================================= */

import { useState } from "react";
import { push, ref, set } from "firebase/database";
import { db } from "../../../firebase";
import { getTimeSlots, localISO } from "../../cafe/utils/time.js";
import { isDateBlocked } from "../../cafe/utils/cafeModel.js";
import {
  MAX_SEATS_PER_BOOKING,
  reserveSeats,
} from "../../cafe/utils/slots.js";
import {
  isValidPhone,
  normalizePhone,
} from "../../../utils/purchaseRequests.js";

export default function WalkInBookingForm({ cafes, ownerUid, onDone }) {
  // Captured when the form opens; good enough for picking today's slots.
  const [openedAt] = useState(() => new Date());
  const today = localISO(openedAt);

  const [cafeId, setCafeId] = useState(cafes[0]?.id || "");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cafe = cafes.find((c) => c.id === cafeId) || cafes[0];
  if (!cafe) return null;

  const closed = isDateBlocked(cafe, new Date(`${date}T00:00:00`), date);
  const slots = closed
    ? []
    : getTimeSlots(
        cafe.opening,
        cafe.closing,
        date === today
          ? openedAt.getHours() * 60 + openedAt.getMinutes()
          : -1,
      );
  const maxSeats = Math.min(MAX_SEATS_PER_BOOKING, cafe.totalSeats);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter the customer's name.");
    if (!time) return setError("Pick a time slot.");
    if (phone.trim() && !isValidPhone(phone))
      return setError("Enter a valid 10-digit mobile number, or leave it empty.");

    setSaving(true);
    try {
      const ok = await reserveSeats(
        cafe.id,
        date,
        time,
        seats,
        cafe.totalSeats,
      );
      if (!ok) {
        setError("Not enough free seats in that slot.");
        return;
      }

      const pricePerHour = Number(cafe.pricePerHour) || 0;
      const now = Date.now();
      await set(push(ref(db, `cafeBookings/${ownerUid}`)), {
        walkIn: true,
        cafeId: cafe.id,
        cafeName: cafe.name,
        address: cafe.address,
        date,
        time,
        seats,
        station: seats > 1 ? `${seats} seats (walk-in)` : "Walk-in",
        pricePerHour,
        totalPrice: pricePerHour * seats,
        status: "Confirmed",
        customerName: name.trim(),
        customerPhone: phone.trim() ? normalizePhone(phone) : "",
        customerEmail: "",
        ownerId: ownerUid,
        createdAt: now,
        confirmedAt: now,
      });

      onDone(`Walk-in booked: ${name.trim()} • ${time} • ${seats} seat(s).`);
    } catch (err) {
      console.error("Walk-in booking error:", err);
      setError("Could not save the walk-in booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="owner-form-card walkin-form" onSubmit={submit}>
      <div className="owner-form-title">
        <div>
          <span className="owner-dashboard-kicker">WALK-IN</span>
          <h3>Book a walk-in customer</h3>
        </div>
        <button type="button" onClick={() => onDone("")}>
          Close
        </button>
      </div>
      <p className="owner-cafe-intro">
        For customers who came in person — their seats are blocked so online
        users can&apos;t book the same slot.
      </p>

      {cafes.length > 1 && (
        <label>
          Café
          <select
            value={cafe.id}
            onChange={(e) => {
              setCafeId(e.target.value);
              setTime("");
            }}
          >
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="owner-form-two">
        <label>
          Date
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value || today);
              setTime("");
            }}
          />
        </label>
        <label>
          Seats
          <select
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          >
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} seat{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Time slot
        {slots.length ? (
          <div className="walkin-slots">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={time === slot ? "active" : ""}
                onClick={() => setTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <span className="walkin-empty">
            {closed
              ? "The café is closed on this date."
              : "No slots left for this date."}
          </span>
        )}
      </label>

      <div className="owner-form-two">
        <label>
          Customer name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul"
          />
        </label>
        <label>
          Mobile (optional)
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            maxLength={14}
          />
        </label>
      </div>

      {error && <div className="walkin-error">{error}</div>}

      <button className="owner-primary-btn" type="submit" disabled={saving}>
        {saving
          ? "Saving..."
          : `Confirm walk-in${time ? ` • ${time}` : ""} • ₹${
              (Number(cafe.pricePerHour) || 0) * seats
            }/hr`}
      </button>
    </form>
  );
}
