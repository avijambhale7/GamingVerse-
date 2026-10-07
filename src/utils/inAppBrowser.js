/* =========================================================
   IN-APP BROWSER DETECTION (pure — unit tested)
   Links opened inside Instagram, Facebook, WhatsApp, Line or an
   Android WebView run in a cut-down browser where Google
   sign-in pop-ups (and often redirects) are blocked by Google.
   The login page uses this to suggest Chrome or Safari.
========================================================= */

const IN_APP_PATTERNS = [
  /Instagram/i,
  /FBAN/, // Facebook app (iOS)
  /FBAV/, // Facebook app version
  /WhatsApp/i,
  /\bLine\//, // LINE messenger ("Line/13.0.0")
  /; wv\)/, // Android WebView
];

export function isInAppBrowser(userAgent = "") {
  const ua = String(userAgent || "");
  return IN_APP_PATTERNS.some((pattern) => pattern.test(ua));
}

// Firebase codes that mean "pop-ups can't work here, try a redirect".
export const POPUP_UNSUPPORTED_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
]);

// iPhone / iPad (iPadOS reports itself as a Mac, so check for touch).
export function isIosDevice({ userAgent = "", platform = "", maxTouchPoints = 0 } = {}) {
  if (/iPhone|iPad|iPod/i.test(String(userAgent))) return true;
  return String(platform) === "MacIntel" && Number(maxTouchPoints) > 1;
}

// On iPhone/iPad, web push only works once the site is added to the
// Home Screen and opened from there (navigator.standalone === true).
export function needsHomeScreenForPush(device = {}) {
  return isIosDevice(device) && device.standalone !== true;
}
