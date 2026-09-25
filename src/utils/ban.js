/* =========================================================
   BAN HELPERS
   Admins set users/{uid}/isBanned = true. These helpers let
   Login refuse a banned account and let App sign one out.
========================================================= */

import { get, ref } from "firebase/database";
import { db } from "../firebase";

// sessionStorage flag App sets before a forced sign-out, so the
// Login page can explain why the user landed back there.
export const BANNED_NOTICE_KEY = "gvBannedNotice";

export const BANNED_MESSAGE =
  "Your account has been banned by an administrator.";

export async function isUserBanned(uid) {
  const snap = await get(ref(db, `users/${uid}/isBanned`));
  return snap.val() === true;
}

// True while App's forced ban sign-out flag is set (read-only).
export function hasBannedNotice() {
  try {
    return sessionStorage.getItem(BANNED_NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

// Returns true once if App flagged a forced ban sign-out, and clears it.
export function consumeBannedNotice() {
  try {
    const flagged = sessionStorage.getItem(BANNED_NOTICE_KEY) === "1";
    sessionStorage.removeItem(BANNED_NOTICE_KEY);
    return flagged;
  } catch {
    return false;
  }
}
