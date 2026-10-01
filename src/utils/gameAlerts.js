/* =========================================================
   GAME RELEASE ALERTS
   "Mark as Interested" on an upcoming game saves an alert at
   gameAlerts/{uid}/{key} with its release date. Each time the
   Games page opens, checkGameAlerts() sends a notification the
   day before release and on release day — once each.
========================================================= */

import { get, ref, remove, serverTimestamp, set, update } from "firebase/database";
import { db } from "../firebase";
import { NOTIFY_TITLES, notifyUser } from "./notify.js";
import { localISO } from "../pages/cafe/utils/time.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const alertKey = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "game";

/* "2026-11-19", "19 Nov 2026", a Date… → "YYYY-MM-DD" or "" */
function toReleaseISO(value) {
  const text = String(value || "").trim();
  if (ISO_DATE.test(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : localISO(parsed);
}

export async function setGameAlert(uid, gameName, releaseDate, on) {
  const iso = toReleaseISO(releaseDate);
  if (!uid || !gameName) return false;
  const path = `gameAlerts/${uid}/${alertKey(gameName)}`;
  if (!on) {
    await remove(ref(db, path));
    return false;
  }
  // Only future releases get an alert.
  if (!iso || iso <= localISO(new Date())) return false;
  await set(ref(db, path), {
    name: String(gameName).slice(0, 120),
    releaseDate: iso,
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function checkGameAlerts(uid) {
  if (!uid) return;
  let alerts;
  try {
    const snap = await get(ref(db, `gameAlerts/${uid}`));
    alerts = snap.val() || {};
  } catch (error) {
    console.warn("Release alerts unavailable:", error);
    return;
  }

  const today = localISO(new Date());
  const tomorrow = localISO(new Date(Date.now() + 24 * 60 * 60 * 1000));

  await Promise.all(
    Object.entries(alerts).map(async ([key, alert]) => {
      const path = `gameAlerts/${uid}/${key}`;
      if (!alert?.releaseDate || alert.released) return;
      try {
        if (alert.releaseDate <= today) {
          await notifyUser(
            uid,
            `🎉 ${alert.name} is out now! Open it on GamingVerse to watch the trailer and share your verdict.`,
            NOTIFY_TITLES.release,
          );
          await update(ref(db, path), { released: true, reminded: true });
        } else if (alert.releaseDate === tomorrow && !alert.reminded) {
          await notifyUser(
            uid,
            `⏰ ${alert.name} releases tomorrow.`,
            NOTIFY_TITLES.release,
          );
          await update(ref(db, path), { reminded: true });
        }
      } catch (error) {
        console.warn("Release alert failed:", error);
      }
    }),
  );
}
