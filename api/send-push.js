/* =========================================================
   POST /api/send-push   (Vercel serverless function)
   Body: { path: "notifications/{uid}/{id}" | "adminNotifications/{id}" }
   Header: Authorization: Bearer <Firebase ID token>

   Delivers an existing in-app notification as a web push via
   Firebase Cloud Messaging. Safe to expose because it only sends
   what is already in the database, only when the caller is the
   notification's author (fromUid), and only once (pushedAt).

   Environment (Vercel → Settings → Environment Variables):
     FIREBASE_SERVICE_ACCOUNT  – the service-account JSON (one line)
     FIREBASE_DATABASE_URL     – optional, defaults to this project's
========================================================= */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

const DEFAULT_DB_URL = "https://gamingverse-26e57-default-rtdb.firebaseio.com";

const LINKS = {
  "GamingVerse Market": "/games?view=marketplace",
  "GamingVerse Café": "/games?view=cafe",
};

function adminApp() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
    initializeApp({
      credential: cert(JSON.parse(raw)),
      databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_DB_URL,
    });
  }
  return getApps()[0];
}

// Which users a notification path should reach.
async function recipientsFor(db, path) {
  const user = /^notifications\/([^/.#$[\]]+)\/([^/.#$[\]]+)$/.exec(path);
  if (user) return [user[1]];
  if (/^adminNotifications\/[^/.#$[\]]+$/.test(path)) {
    const snap = await db.ref("users").orderByChild("role").equalTo("admin").get();
    return Object.keys(snap.val() || {});
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    adminApp();
  } catch (error) {
    console.error(error);
    return res.status(503).json({ error: "Push is not configured on the server" });
  }

  const match = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!match) return res.status(401).json({ error: "Missing token" });

  let caller;
  try {
    caller = await getAuth().verifyIdToken(match[1]);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const path = String(req.body?.path || "");
  const db = getDatabase();
  const recipients = await recipientsFor(db, path);
  if (!recipients) return res.status(400).json({ error: "Invalid path" });

  const noteRef = db.ref(path);
  const note = (await noteRef.get()).val();
  if (!note) return res.status(404).json({ error: "Notification not found" });
  if (note.fromUid !== caller.uid) return res.status(403).json({ error: "Not your notification" });
  if (note.pushedAt) return res.status(200).json({ sent: 0, skipped: "already pushed" });

  // Claim it first so a retry can't push the same notification twice.
  await noteRef.update({ pushedAt: Date.now() });

  const targets = recipients.filter((uid) => uid !== caller.uid);
  const entries = [];
  for (const uid of targets) {
    const tokens = (await db.ref(`pushTokens/${uid}`).get()).val() || {};
    for (const [key, value] of Object.entries(tokens)) {
      if (value?.token) entries.push({ uid, key, token: value.token });
    }
  }
  if (!entries.length) return res.status(200).json({ sent: 0 });

  const title = note.title || "GamingVerse";
  const link = LINKS[title] || "/games";
  let response;
  try {
    response = await getMessaging().sendEachForMulticast({
      tokens: entries.map((e) => e.token),
      data: {
        title,
        body: String(note.message || "").slice(0, 400),
        link,
        tag: path,
      },
      webpush: { headers: { Urgency: "high", TTL: "86400" } },
    });
  } catch (error) {
    console.error("FCM send failed:", error);
    return res.status(502).json({ error: "Push service error" });
  }

  // Forget tokens for uninstalled / expired browsers.
  const stale = [];
  response.responses.forEach((r, i) => {
    const code = r.error?.code || "";
    if (code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token") {
      stale.push(db.ref(`pushTokens/${entries[i].uid}/${entries[i].key}`).remove());
    }
  });
  await Promise.all(stale);

  return res.status(200).json({ sent: response.successCount, failed: response.failureCount });
}
