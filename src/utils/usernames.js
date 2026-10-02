/* =========================================================
   UNIQUE USERNAMES
   usernames/{handle} = uid       who owns a handle — private
                                  (owner and admins only)
   usernameTaken/{handle} = true  the public "is this free?" list

   Both are written together. A claim needs no read: the database
   only accepts it if the handle is free (or already this
   account's), so two people signing up with the same name at the
   same moment can't both get it.
========================================================= */

import { get, ref, update } from "firebase/database";
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
  const taken = await get(ref(db, `usernameTaken/${handle}`));
  if (!taken.exists()) return true;
  if (!uid) return false;
  // Only the owner can read who holds it, so a successful read means "mine".
  try {
    return (await get(ref(db, `usernames/${handle}`))).val() === uid;
  } catch {
    return false;
  }
}

// Resolves true when `uid` now owns the handle, false if someone else does.
export async function claimUsername(value, uid) {
  const handle = normalizeUsername(value);
  try {
    await update(ref(db), {
      [`usernames/${handle}`]: uid,
      [`usernameTaken/${handle}`]: true,
    });
    return true;
  } catch {
    return false; // the rules refused: someone else holds it
  }
}

// Frees a handle, but only if this account is the one holding it
// (the rules refuse anyone else, so a failure is ignored).
export async function releaseUsername(value, uid) {
  const handle = normalizeUsername(value);
  if (!isValidUsername(handle) || !uid) return;
  try {
    await update(ref(db), {
      [`usernames/${handle}`]: null,
      [`usernameTaken/${handle}`]: null,
    });
  } catch {
    // not ours, or already free
  }
}
