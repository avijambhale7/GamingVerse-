/* =========================================================
   NOTIFICATIONS
   Writes an in-app notification (shown in the 🔔 bell) and then
   asks the server to deliver it as a push notification to the
   recipient's devices. Pushes are skipped for notifications a
   user sends to themselves — they're already looking at the app.
========================================================= */

import { push, ref, serverTimestamp } from "firebase/database";
import { auth, db } from "../firebase";
import { sendPush } from "./push.js";

export const NOTIFY_TITLES = {
  market: "GamingVerse Market",
  cafe: "GamingVerse Café",
  feed: "GamingVerse Feed",
  release: "GamingVerse Release",
  support: "GamingVerse Support",
  admin: "GamingVerse Admin",
};

function write(path, title, message) {
  const fromUid = auth.currentUser?.uid;
  if (!fromUid) return Promise.resolve(null);
  return push(ref(db, path), {
    title,
    message,
    type: "update",
    fromUid,
    read: false,
    createdAt: serverTimestamp(),
  })
    .then((newRef) => `${path}/${newRef.key}`)
    .catch((error) => {
      console.error("Notification write failed:", error);
      return null;
    });
}

export async function notifyUser(uid, message, title = NOTIFY_TITLES.market) {
  if (!uid) return;
  const path = await write(`notifications/${uid}`, title, message);
  if (path && uid !== auth.currentUser?.uid) sendPush(path);
}

export async function notifyAdmins(message, title = NOTIFY_TITLES.market) {
  const path = await write("adminNotifications", title, message);
  if (path) sendPush(path);
}
