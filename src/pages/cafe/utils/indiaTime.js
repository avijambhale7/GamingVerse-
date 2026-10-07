/* =========================================================
   INDIA TIME (Asia/Kolkata) — the one clock for cafés
   Every café is in India, so "today", slot times, past/future
   slots, the ticket "not today" check and revenue months all
   use India time, whatever timezone the phone is set to.
   India has a fixed offset (UTC+5:30, no daylight saving), so
   this is plain arithmetic on the UTC time — it never reads
   the device's timezone. Unit tested in indiaTime.test.js.
========================================================= */

export const INDIA_OFFSET_MINUTES = 5 * 60 + 30;
const OFFSET_MS = INDIA_OFFSET_MINUTES * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The India wall-clock reading for a moment in time.
export function indiaParts(ms = Date.now()) {
  const shifted = new Date(Number(ms) + OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0-11
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

// "YYYY-MM-DD" in India for a moment (default: now).
export function indiaDateISO(ms = Date.now()) {
  const { year, month, day } = indiaParts(ms);
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export const indiaTodayISO = (ms = Date.now()) => indiaDateISO(ms);

// Minutes since midnight in India (for "slots that haven't started").
export function indiaMinutesNow(ms = Date.now()) {
  const { hours, minutes } = indiaParts(ms);
  return hours * 60 + minutes;
}

// The next `count` India dates starting today: ["2026-10-08", …].
export function indiaUpcomingDates(count = 7, ms = Date.now()) {
  return Array.from({ length: count }, (_, i) => indiaDateISO(Number(ms) + i * DAY_MS));
}

// Weekday ("Mon") of a calendar date — the same everywhere on Earth.
export function weekdayOfISO(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return "";
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// { year, month } (month 0-11) of a moment, in India.
export function indiaMonthOf(ms = Date.now()) {
  const { year, month } = indiaParts(ms);
  return { year, month };
}

// The moment (ms) an India date + minutes-after-midnight happens.
export function indiaMoment(iso, minutesAfterMidnight = 0) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return NaN;
  return Date.UTC(y, m - 1, d, 0, Number(minutesAfterMidnight) || 0) - OFFSET_MS;
}
