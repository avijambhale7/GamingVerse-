/* =========================================================
   GET /api/health   (Vercel serverless function, admins only)
   Header: Authorization: Bearer <Firebase ID token of an admin>

   Answers "is everything configured?" for Admin → System status.
   Returns only true/false (and a rules status word) — never any
   key, secret or URL:

   {
     serviceAccount: bool,   FIREBASE_SERVICE_ACCOUNT set and parses
     rawgConfigured: bool,   RAWG key present
     rawgReachable:  bool,   one tiny RAWG request succeeded
     trailerKey:     bool,   YOUTUBE_API_KEY present (api/trailer.js)
     pushServer:     bool,   what api/send-push.js needs (service account)
     pushClientKey:  bool,   VITE_FIREBASE_VAPID_KEY present for this build
     rules: "up_to_date" | "not_published" | "unknown"
   }

   The rules check reads the LIVE rules with the Admin SDK's access
   token and compares them with database.rules.json from this deploy
   (the file is bundled with the function — see vercel.json).
========================================================= */

import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { rulesFingerprint } from "../src/utils/systemStatus.js";

const DEFAULT_DB_URL = "https://gamingverse-26e57-default-rtdb.firebaseio.com";

function parseServiceAccount() {
  try {
    const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "");
    return json && json.private_key && json.client_email ? json : null;
  } catch {
    return null;
  }
}

function adminApp(serviceAccount) {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_DB_URL,
    });
  }
  return getApps()[0];
}

// database.rules.json as deployed with this build.
function builtRules() {
  try {
    return readFileSync(new URL("../database.rules.json", import.meta.url), "utf8");
  } catch {
    return null;
  }
}

async function liveRules(app) {
  const dbUrl = process.env.FIREBASE_DATABASE_URL || DEFAULT_DB_URL;
  const emulator = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  if (emulator) {
    const ns = new URL(dbUrl).hostname.split(".")[0];
    const res = await fetch(`http://${emulator}/.settings/rules.json?ns=${ns}`, {
      headers: { Authorization: "Bearer owner" },
    });
    return res.ok ? res.text() : null;
  }
  const { access_token: token } = await app.options.credential.getAccessToken();
  const res = await fetch(`${dbUrl}/.settings/rules.json`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.text() : null;
}

async function rulesStatus(app) {
  const built = builtRules();
  if (!built) return "unknown";
  try {
    const live = await liveRules(app);
    if (!live) return "unknown";
    return rulesFingerprint(live) === rulesFingerprint(built)
      ? "up_to_date"
      : "not_published";
  } catch (error) {
    console.error("Rules check failed:", error.message);
    return "unknown";
  }
}

async function rawgReachable(key) {
  if (!key) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&page_size=1`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    // Can't verify who's asking without the Admin SDK — say only that.
    return res.status(503).json({ serviceAccount: false });
  }

  let app;
  try {
    app = adminApp(serviceAccount);
  } catch (error) {
    console.error("Admin SDK init failed:", error.message);
    return res.status(503).json({ serviceAccount: false });
  }

  // Admins only.
  const header = String(req.headers?.authorization || "");
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) return res.status(401).json({ error: "Sign in as an admin." });
  try {
    const { uid } = await getAuth(app).verifyIdToken(idToken);
    const role = (await getDatabase(app).ref(`users/${uid}/role`).get()).val();
    if (role !== "admin") return res.status(403).json({ error: "Admins only." });
  } catch {
    return res.status(401).json({ error: "Sign in as an admin." });
  }

  const rawgKey = String(process.env.RAWG_API_KEY || process.env.VITE_RAWG_API_KEY || "").trim();
  const [reachable, rules] = await Promise.all([rawgReachable(rawgKey), rulesStatus(app)]);

  return res.status(200).json({
    serviceAccount: true,
    rawgConfigured: Boolean(rawgKey),
    rawgReachable: reachable,
    trailerKey: Boolean(String(process.env.YOUTUBE_API_KEY || "").trim()),
    pushServer: true,
    pushClientKey: Boolean(String(process.env.VITE_FIREBASE_VAPID_KEY || "").trim()),
    rules,
  });
}
