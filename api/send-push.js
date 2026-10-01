/* =========================================================
   POST /api/send-push   (Vercel serverless function)
   Body: { path: "notifications/{uid}/{id}" | "adminNotifications/{id}" }
   Header: Authorization: Bearer <Firebase ID token>

   Delivers an existing in-app notification as a web push via
   Firebase Cloud Messaging. Safe to expose because it only sends
   what is already in the database, only when the caller is the
   notification's author (fromUid), at most 20 times a minute per
   caller, and only once: a notification is claimed while sending
   (pushSendingAt) and marked pushedAt only after FCM accepts it,
   so a failed send can be retried.

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
  "GamingVerse Feed": "/games?view=spaces",
  "GamingVerse Release": "/games?view=upcomings",
};

const RATE_LIMIT = 20; // pushes per caller…
const RATE_WINDOW_MS = 60 * 1000; // …per minute
const CLAIM_MS = 60 * 1000; // a stuck "sending" claim expires after this
const MAX_TOKENS_PER_USER = 10;

// pushRateLimits/{uid} is server-only (no client rule grants access).
async function withinRateLimit(db, uid) {
  const result = await db.ref(`pushRateLimits/${uid}`).transaction((current) => {
    const now = Date.now();
    if (!current || now - Number(current.windowStart || 0) > RATE_WINDOW_MS) {
      return { windowStart: now, count: 1 };
    }
    if (Number(current.count || 0) >= RATE_LIMIT) return; // abort: over limit
    return { ...current, count: Number(current.count || 0) + 1 };
  });
  return result.committed;
}

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

  if (!(await withinRateLimit(db, caller.uid))) {
    return res.status(429).json({ error: "Too many push requests, slow down" });
  }

  // Claim it atomically so two requests can't both send it. The claim is
  // released if sending fails, and expires if a request dies mid-send.
  const stamp = Date.now();
  const claim = await noteRef.transaction((current) => {
    // The first run can see null (nothing cached yet); returning it makes
    // Firebase retry with the real value instead of giving up.
    if (current === null) return current;
    if (current.pushedAt) return; // already sent
    if (current.pushSendingAt && stamp - current.pushSendingAt < CLAIM_MS) return;
    return { ...current, pushSendingAt: stamp };
  });
  const claimedByUs =
    claim.committed && claim.snapshot.child("pushSendingAt").val() === stamp;
  if (!claimedByUs) {
    return res.status(200).json({ sent: 0, skipped: "already being sent" });
  }
  const markSent = () => noteRef.update({ pushedAt: Date.now(), pushSendingAt: null });
  const releaseClaim = () => noteRef.update({ pushSendingAt: null });

  const targets = recipients.filter((uid) => uid !== caller.uid);
  const entries = [];
  for (const uid of targets) {
    const tokens = (await db.ref(`pushTokens/${uid}`).get()).val() || {};
    Object.entries(tokens)
      .filter(([, value]) => value?.token)
      .slice(0, MAX_TOKENS_PER_USER)
      .forEach(([key, value]) => entries.push({ uid, key, token: value.token }));
  }
  if (!entries.length) {
    await markSent(); // nobody has push turned on: nothing to retry
    return res.status(200).json({ sent: 0 });
  }

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
    await releaseClaim().catch(() => {}); // let a later request retry
    return res.status(502).json({ error: "Push service error" });
  }

  // Only now is it really sent.
  await markSent();

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
