/* =========================================================
   SUPPORT CONTACT DETAILS
   Edit these to your real support email and WhatsApp number.
   They're shown in the "Help & Support" pop-up (login page,
   profile, and the date-of-birth note in Edit Profile).
========================================================= */

export const SUPPORT_EMAIL = "support@gamingverse.example";

// WhatsApp number in international format, digits only
// (country code first, no "+", spaces or dashes) — e.g. 919876543210.
export const SUPPORT_WHATSAPP = "919999999999";

// Pre-filled first message for WhatsApp chats.
export const SUPPORT_WHATSAPP_MESSAGE = "Hi GamingVerse support, I need help with";

export const supportMailto = (subject = "GamingVerse support") =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export const supportWhatsAppUrl = (message = SUPPORT_WHATSAPP_MESSAGE) =>
  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
