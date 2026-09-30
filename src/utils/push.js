/* =========================================================
   PUSH NOTIFICATIONS (Firebase Cloud Messaging, web push)

   enablePush(uid)  – asks permission, registers /push-sw.js and
                      stores this device's FCM token at
                      pushTokens/{uid}/{key}.
   disablePush(uid) – deletes the token so this device stops
                      receiving pushes.
   sendPush(path)   – asks /api/send-push to deliver an existing
                      in-app notification (notifications/{uid}/{id}
                      or adminNotifications/{id}) as a push. The
                      server checks the caller wrote it and only
                      pushes each notification once.
========================================================= */

import { get, ref, remove, set } from "firebase/database";
import { app, auth, db } from "../firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
const SW_URL = "/push-sw.js";
const LOCAL_KEY = "gvPushTokenKey";

let messagingPromise = null;

// Loaded lazily so browsers without push never download the SDK.
async function getMessagingIfSupported() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (typeof window === "undefined") return null;
      if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
      const m = await import("firebase/messaging");
      if (!(await m.isSupported())) return null;
      return { m, messaging: m.getMessaging(app) };
    })().catch(() => null);
  }
  return messagingPromise;
}

export async function isPushSupported() {
  return Boolean(VAPID_KEY) && Boolean(await getMessagingIfSupported());
}

export function pushPermission() {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

// RTDB keys can't contain . # $ [ ] /
const tokenKey = (token) => token.replace(/[.#$[\]/]/g, "_");

function rememberKey(key) {
  try {
    if (key) localStorage.setItem(LOCAL_KEY, key);
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* storage blocked — the toggle just re-checks the database */
  }
}

function rememberedKey() {
  try {
    return localStorage.getItem(LOCAL_KEY) || "";
  } catch {
    return "";
  }
}

// True when this device has a saved token for this user.
export async function isPushEnabled(uid) {
  const key = rememberedKey();
  if (!uid || !key || pushPermission() !== "granted") return false;
  try {
    return (await get(ref(db, `pushTokens/${uid}/${key}`))).exists();
  } catch {
    return false;
  }
}

export async function enablePush(uid) {
  const fcm = await getMessagingIfSupported();
  if (!fcm || !VAPID_KEY) throw new Error("Push notifications aren't supported in this browser.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Allow them in your browser's site settings."
        : "Notification permission was not granted.",
    );
  }

  const registration = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;
  let token;
  try {
    token = await fcm.m.getToken(fcm.messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    // The browser couldn't reach its push service. Brave switches
    // Google's push service off by default, which fails exactly here.
    if (/push service/i.test(String(error?.message || ""))) {
      throw new Error(
        navigator.brave
          ? "Brave blocks push by default. Turn on brave://settings/privacy → \"Use Google services for push messaging\", restart Brave, then try again."
          : "Your browser's push service isn't reachable. Check that push/Google services aren't disabled in browser settings, then try again.",
        { cause: error },
      );
    }
    throw error;
  }
  if (!token) throw new Error("Could not get a push token for this device.");

  const key = tokenKey(token);
  await set(ref(db, `pushTokens/${uid}/${key}`), {
    token,
    createdAt: Date.now(),
    userAgent: navigator.userAgent.slice(0, 200),
  });
  rememberKey(key);
}

export async function disablePush(uid) {
  const key = rememberedKey();
  const fcm = await getMessagingIfSupported();
  try {
    if (fcm) await fcm.m.deleteToken(fcm.messaging);
  } catch {
    /* token may already be gone */
  }
  if (uid && key) await remove(ref(db, `pushTokens/${uid}/${key}`));
  rememberKey("");
}

// Fire-and-forget: a failed push never blocks the in-app notification.
export async function sendPush(path) {
  const user = auth.currentUser;
  if (!user || !path) return;
  try {
    const idToken = await user.getIdToken();
    await fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ path }),
    });
  } catch (error) {
    console.warn("Push delivery request failed:", error);
  }
}
