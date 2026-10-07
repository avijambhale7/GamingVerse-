/* =========================================================
   AUTH FLOW HELPERS (pure — unit tested in authFlow.test.js)
   Where a user lands after login, whether a login field holds
   an email or a username, and plain-language messages for
   Firebase auth error codes.
========================================================= */

export const BUSINESS_ROLES = new Set([
  "owner",
  "cafe_owner",
  "shop_owner",
  "accessory_owner",
]);

// Home page for a profile (users/{uid}): admins → /admin, business
// accounts (approved or still awaiting approval) → /owner-dashboard,
// everyone else → /games.
export function homePathFor(profile = {}) {
  const role = String(profile?.role || "").toLowerCase();
  if (role === "admin") return "/admin";
  if (BUSINESS_ROLES.has(role)) return "/owner-dashboard";
  if (!role && profile?.requestedRole) return "/owner-dashboard";
  return "/games";
}

// A business account (approved or pending approval).
export function isBusinessProfile(profile = {}) {
  const role = String(profile?.role || "").toLowerCase();
  return BUSINESS_ROLES.has(role) || (!role && Boolean(profile?.requestedRole));
}

// The page a signed-out visitor was trying to open (ProtectedRoute
// passes it as location.state.from). Only same-site app paths are
// accepted, and never /login itself.
export function returnPathFrom(from) {
  if (!from || typeof from !== "object") return "";
  const pathname = String(from.pathname || "");
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return "";
  if (pathname === "/" || pathname.startsWith("/login")) return "";
  return `${pathname}${from.search || ""}${from.hash || ""}`;
}

// "Email or username" login field: anything with an @ is an email.
export function isEmailIdentifier(value = "") {
  return String(value).includes("@");
}

export const INVALID_LOGIN_MESSAGE = "Invalid username/email or password.";
export const USERNAME_LOGIN_UNAVAILABLE_MESSAGE =
  "Username login isn't available right now. Please log in with your email instead.";

const COMMON = {
  "auth/too-many-requests":
    "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed":
    "Network error. Check your internet connection and try again.",
  "auth/user-disabled":
    "This account has been disabled. Contact GamingVerse support.",
  "auth/popup-blocked":
    "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
  "auth/operation-not-allowed":
    "This sign-in method isn't available right now. Please try another way.",
  "auth/invalid-email": "That email address doesn't look right.",
};

const BY_ACTION = {
  login: {
    "auth/invalid-credential": INVALID_LOGIN_MESSAGE,
    "auth/user-not-found": INVALID_LOGIN_MESSAGE,
    "auth/wrong-password": INVALID_LOGIN_MESSAGE,
    "auth/invalid-login-credentials": INVALID_LOGIN_MESSAGE,
    "auth/invalid-custom-token": INVALID_LOGIN_MESSAGE,
    "auth/invalid-email": INVALID_LOGIN_MESSAGE,
    // /api/resolve-username isn't configured or failed (503 / 5xx) —
    // not a wrong password, so don't say it is.
    "app/username-login-unavailable": USERNAME_LOGIN_UNAVAILABLE_MESSAGE,
  },
  signup: {
    "auth/email-already-in-use": "This email is already registered. Log in instead.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  },
  reset: {},
  google: {
    "auth/account-exists-with-different-credential":
      "An account already exists with this email. Log in with your password instead.",
  },
};

const FALLBACK = {
  login: "Login failed. Please try again.",
  signup: "Couldn't create your account. Please try again.",
  reset: "Couldn't send the reset email. Please try again.",
  google: "Google sign-in failed. Please try again.",
};

// Codes that mean "the user changed their mind" — show nothing.
const SILENT = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

// Plain message for a Firebase auth error code, or "" when nothing
// should be shown. Never echoes Firebase's raw error text.
export function authErrorMessage(code, action = "login") {
  if (SILENT.has(code)) return "";
  return (
    BY_ACTION[action]?.[code] || COMMON[code] || FALLBACK[action] || FALLBACK.login
  );
}

const ROLE_LABELS = {
  admin: "Admin",
  owner: "Owner",
  cafe_owner: "Café owner",
  shop_owner: "Shop owner",
  accessory_owner: "Accessory seller",
};

// "cafe_owner" → "Café owner" (unknown roles are tidied up, not shown raw).
export function roleLabel(role = "") {
  const key = String(role || "").toLowerCase();
  if (!key) return "";
  if (ROLE_LABELS[key]) return ROLE_LABELS[key];
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
