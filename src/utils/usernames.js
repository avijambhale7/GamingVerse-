/* =========================================================
   UNIQUE USERNAMES
   usernames/{handle} = uid reserves a handle for one account.
   Claiming is a transaction, so two people signing up with the
   same name at the same moment can't both get it.
========================================================= */

import { get, ref, remove, runTransaction } from "firebase/database";
import { db } from "../firebase";

export const USERNAME_RULE_TEXT =
  "3–20 characters: lowercase letters, numbers, _ or .";

export function normalizeUsername(value = "") {
  return String(value).trim().replace(/^@+/, "").toLowerCase();
}

export function isValidUsername(value = "") {
  return /^[a-z0-9_.]{3,20}$/.test(normalizeUsername(value));
}

// Available when nobody holds it, or `uid` already does.
export async function isUsernameAvailable(value, uid = "") {
  const handle = normalizeUsername(value);
  const snap = await get(ref(db, `usernames/${handle}`));
  return !snap.exists() || (uid && snap.val() === uid);
}

// Resolves true when `uid` now owns the handle, false if someone else does.
export async function claimUsername(value, uid) {
  const handle = normalizeUsername(value);
  const tx = await runTransaction(ref(db, `usernames/${handle}`), (current) => {
    if (current === null || current === uid) return uid;
    return undefined; // taken — abort
  });
  return tx.committed && tx.snapshot.val() === uid;
}

// Frees a handle, but only if this account is the one holding it.
export async function releaseUsername(value, uid) {
  const handle = normalizeUsername(value);
  if (!isValidUsername(handle)) return;
  const snap = await get(ref(db, `usernames/${handle}`));
  if (snap.val() === uid) await remove(ref(db, `usernames/${handle}`));
}
