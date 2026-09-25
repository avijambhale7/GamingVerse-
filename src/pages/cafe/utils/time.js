/* =========================================================
   TIME SLOT HELPERS
========================================================= */

export const pad = (n) => String(n).padStart(2, "0");

export function parseTime(value) {
  const m = String(value || "").match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] || 0);
  const ampm = m[3]?.toUpperCase();
  if (ampm === "AM" && hour === 12) hour = 0;
  if (ampm === "PM" && hour !== 12) hour += 12;
  return hour * 60 + minute;
}

export function formatTime(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad(minute)} ${suffix}`;
}

// `afterMinutes` (minutes since today's midnight) drops every slot that
// has already started — pass it for today so the list begins at the next
// hour. Overnight slots past midnight count as > 24*60, so they stay.
export function getTimeSlots(opening, closing, afterMinutes = -1) {
  if (/online appointment/i.test(opening)) return [];
  if (/24\s*hours/i.test(opening))
    return Array.from({ length: 24 }, (_, i) => i * 60)
      .filter((t) => t > afterMinutes)
      .map(formatTime);
  const start = parseTime(opening);
  const endRaw = parseTime(closing);
  if (start == null || endRaw == null) return [];
  let end = endRaw;
  if (end <= start) end += 24 * 60;
  const slots = [];
  for (let t = start; t < end; t += 60) {
    if (t > afterMinutes) slots.push(formatTime(t % (24 * 60)));
  }
  return slots;
}

export function todayISO() {
  return localISO(new Date());
}

// YYYY-MM-DD in the user's local timezone.
export function localISO(d) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
