/* =========================================================
   BIRTH DATE CHECKS (pure — unit tested in birthDate.test.js)
   Used when an admin corrects a user's date of birth.
========================================================= */

const DOB = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Age in whole years on `today` for a YYYY-MM-DD date, or null if the
// date isn't a real calendar date.
export function ageOn(dob, today = new Date()) {
  const match = DOB.exec(String(dob || ""));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects dates like 2023-02-30 that JS would roll over.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  let age = y - year;
  if (m < month || (m === month && d < day)) age -= 1;
  return age;
}

// { ok: true, age } or { ok: false, error } for an admin-entered date.
export function checkBirthDate(dob, today = new Date()) {
  if (!DOB.test(String(dob || ""))) {
    return { ok: false, error: "Enter the date as YYYY-MM-DD." };
  }
  const age = ageOn(dob, today);
  if (age === null) return { ok: false, error: "That date doesn't exist." };
  if (age < 0) return { ok: false, error: "The date can't be in the future." };
  if (age > 120) return { ok: false, error: "Age must be 120 or under." };
  return { ok: true, age };
}
