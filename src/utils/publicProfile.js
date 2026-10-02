/* =========================================================
   PUBLIC PROFILES
   users/{uid} is private (phone, email, age, role…), so other
   gamers see only this small card, written by its owner:

   publicProfiles/{uid} = { name, handle, bio, photo, updatedAt }

   It is refreshed whenever the owner opens their profile or the
   feed, and after they save their profile.
========================================================= */

import { get, ref, serverTimestamp, set } from "firebase/database";
import { db } from "../firebase";

const MAX_PHOTO = 130000; // must match database.rules.json

export function toPublicProfile(data = {}, authUser = null) {
  const handle = String(data.username || "").trim();
  const name =
    `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
    handle ||
    String(authUser?.displayName || "").trim() ||
    "Gamer";
  const photo = String(data.photoURL || authUser?.photoURL || "");
  return {
    name: name.slice(0, 80),
    handle,
    bio: String(data.bio || "").trim().slice(0, 300),
    photo:
      photo.length <= MAX_PHOTO &&
      (photo.startsWith("https://") || photo.startsWith("data:image/"))
        ? photo
        : "",
  };
}

// Writes the card only when something changed. Never throws: a
// failure here must not break the page that called it.
export async function syncPublicProfile(uid, data, authUser) {
  if (!uid) return;
  const next = toPublicProfile(data, authUser);
  try {
    const current = (await get(ref(db, `publicProfiles/${uid}`))).val() || {};
    const same = ["name", "handle", "bio", "photo"].every(
      (key) => (current[key] || "") === next[key],
    );
    if (same) return;
    await set(ref(db, `publicProfiles/${uid}`), {
      ...next,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Public profile sync failed:", error);
  }
}

export const userPath = (uid) => `/user/${encodeURIComponent(uid)}`;
