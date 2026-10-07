/* =========================================================
   POST /api/resolve-username   (Vercel serverless function)
   Body: { username, password }
   → 200 { token }   a Firebase custom token for signInWithCustomToken
   → 401 { error: "invalid" }  for EVERY failure (unknown username,
                               no email, wrong password, bad input)
   → 429 { error: "rate_limited" }
   → 503 { error: "unavailable" }  server not configured

   Logged-out visitors can't read usernames/{handle} (it's private),
   so "log in with a username" happens here, with the Admin SDK:
   usernames/{handle} → uid → that account's email → the password is
   checked against Firebase Auth. The email never leaves the server,
   and a wrong username looks exactly like a wrong password (same
   status, same body, similar timing), so the endpoint can't be used
   to find out which usernames or emails exist.

   Per-IP and per-username attempt limits live in loginRateLimits/
   (server-only: no client rule grants access).

   Environment (Vercel → Settings → Environment Variables):
     FIREBASE_SERVICE_ACCOUNT  – the service-account JSON (one line)
     FIREBASE_DATABASE_URL     – optional, defaults to this project's
     FIREBASE_WEB_API_KEY      – optional, defaults to the public web key
========================================================= */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const DEFAULT_DB_URL = "https://gamingverse-26e57-default-rtdb.firebaseio.com";
// The same public key the web app ships in src/firebase.js.
const DEFAULT_WEB_API_KEY = "AIzaSyBFN7rnYeZs22EGYOINP70wJoRTCazs9BA";

const HANDLE = /^[a-z0-9_.]{3,20}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 10; // attempts per IP per 10 minutes
const MAX_PER_HANDLE = 15; // attempts on one username per 10 minutes
const MIN_RESPONSE_MS = 700; // even out timing between failure paths

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

// Same normalisation as src/utils/usernames.js normalizeUsername().
function normalizeHandle(value = "") {
  return String(value).trim().replace(/^@+/, "").toLowerCase();
}

function clientIp(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "");
  return (
    forwarded.split(",")[0].trim() ||
    String(req.headers?.["x-real-ip"] || "") ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// Database keys can't contain . # $ [ ] / — keep only safe characters.
const limitKey = (prefix, value) =>
  `${prefix}_${String(value).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80)}`;

async function withinLimit(db, key, max) {
  const result = await db.ref(`loginRateLimits/${key}`).transaction((current) => {
    const now = Date.now();
    if (!current || now - Number(current.windowStart || 0) > WINDOW_MS) {
      return { windowStart: now, count: 1 };
    }
    if (Number(current.count || 0) >= max) return; // abort: over limit
    return { ...current, count: Number(current.count || 0) + 1 };
  });
  return result.committed;
}

// Checks the password with Firebase Auth's REST API (the Admin SDK
// can't). Resolves to the account's uid, or "" for a bad password.
async function verifyPassword(email, password) {
  const key = process.env.FIREBASE_WEB_API_KEY || DEFAULT_WEB_API_KEY;
  // The Auth emulator (local testing) serves the same API under its host,
  // just as the Admin SDK switches to it when this variable is set.
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const base = emulator
    ? `http://${emulator}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  const response = await fetch(
    `${base}/v1/accounts:signInWithPassword?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (response.ok) return String(body.localId || "");
  if (String(body?.error?.message || "").startsWith("TOO_MANY_ATTEMPTS")) {
    const error = new Error("too many attempts");
    error.rateLimited = true;
    throw error;
  }
  return "";
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  const started = Date.now();
  const reply = async (status, body) => {
    const left = MIN_RESPONSE_MS - (Date.now() - started);
    if (left > 0) await wait(left);
    return res.status(status).json(body);
  };
  const invalid = () => reply(401, { error: "invalid" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const handle = normalizeHandle(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";

  let db;
  let auth;
  try {
    const app = adminApp();
    db = getDatabase(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("resolve-username not configured:", error.message);
    return reply(503, { error: "unavailable" });
  }

  try {
    if (!(await withinLimit(db, limitKey("ip", clientIp(req)), MAX_PER_IP))) {
      return reply(429, { error: "rate_limited" });
    }
    if (!HANDLE.test(handle) || !password || password.length > 4096) {
      return invalid();
    }
    if (!(await withinLimit(db, limitKey("u", handle), MAX_PER_HANDLE))) {
      return reply(429, { error: "rate_limited" });
    }

    const uid = (await db.ref(`usernames/${handle}`).get()).val();
    if (typeof uid !== "string" || !uid) return invalid();

    // The sign-in email is the Auth account's; users/{uid}/email is a
    // fallback for accounts whose Auth record can't be read.
    let email = "";
    try {
      email = (await auth.getUser(uid)).email || "";
    } catch {
      email = "";
    }
    if (!email) {
      email = String((await db.ref(`users/${uid}/email`).get()).val() || "");
    }
    if (!email) return invalid();

    const verifiedUid = await verifyPassword(email, password);
    if (!verifiedUid || verifiedUid !== uid) return invalid();

    const token = await auth.createCustomToken(uid);
    return reply(200, { token });
  } catch (error) {
    if (error?.rateLimited) return reply(429, { error: "rate_limited" });
    console.error("resolve-username failed:", error);
    return invalid();
  }
}
