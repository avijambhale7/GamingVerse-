/* =========================================================
   SUPPORT CONTACT DETAILS
   Shown in the "Help & Support" pop-up (login page, profile,
   and the date-of-birth note in Edit Profile).

   TODO: replace SUPPORT_EMAIL with the real support address.
   While it's a placeholder, Admin → System status shows a ⚠️
   and the "support contacts are real" unit test is skipped.
========================================================= */

export const SUPPORT_EMAIL = "support@gamingverse.example";

// WhatsApp number in international format, digits only (country code
// first, e.g. 919876543210). Empty = no WhatsApp option is shown.
export const SUPPORT_WHATSAPP = "";

// Values that mean "not filled in yet".
export function isPlaceholderEmail(email = SUPPORT_EMAIL) {
  const value = String(email || "").trim().toLowerCase();
  return !value || value.includes("example") || /^\[.*\]$/.test(value) || !value.includes("@");
}

export function isPlaceholderWhatsApp(number = SUPPORT_WHATSAPP) {
  const value = String(number || "").trim();
  // Empty is allowed (WhatsApp turned off); the old dummy number isn't.
  return value === "919999999999" || value.includes("example") || /^\[.*\]$/.test(value);
}

// Pre-filled first message for WhatsApp chats.
export const SUPPORT_WHATSAPP_MESSAGE = "Hi GamingVerse support, I need help with";

export const supportMailto = (subject = "GamingVerse support") =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export const supportWhatsAppUrl = (message = SUPPORT_WHATSAPP_MESSAGE) =>
  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
