/* =========================================================
   SINGULAR / PLURAL (pure — unit tested in plural.test.js)
   Every count shown to users goes through these, so it's
   "1 member" / "2 members", never "1 members".
========================================================= */

// The word alone: pluralWord(1, "member") → "member", (2) → "members".
// Irregular plurals: pluralWord(2, "reply", "replies") → "replies".
export function pluralWord(count, singular, pluralForm = `${singular}s`) {
  return Number(count) === 1 ? singular : pluralForm;
}

// Count + word: plural(1, "member") → "1 member", (2) → "2 members".
export function plural(count, singular, pluralForm = `${singular}s`) {
  const n = Number(count) || 0;
  return `${n} ${pluralWord(n, singular, pluralForm)}`;
}
