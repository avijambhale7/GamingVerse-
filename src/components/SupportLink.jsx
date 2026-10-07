/* =========================================================
   HELP & SUPPORT
   A link/button that opens a small pop-up with the support
   email and WhatsApp (values in src/config/support.js).
   Used on the login page, the profile card and Edit Profile.
========================================================= */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  SUPPORT_EMAIL,
  supportMailto,
  supportWhatsAppUrl,
} from "../config/support.js";
import useEscapeKey from "../utils/useEscapeKey.js";
import "./SupportLink.css";

export default function SupportLink({
  className = "",
  children = "Help & Support",
  topic = "",
}) {
  const [open, setOpen] = useState(false);
  useEscapeKey(() => setOpen(false), open);

  const subject = topic ? `GamingVerse support: ${topic}` : "GamingVerse support";
  const whatsappText = topic
    ? `Hi GamingVerse support, I need help with: ${topic}`
    : undefined;

  return (
    <>
      <button
        type="button"
        className={`support-link ${className}`.trim()}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div className="support-backdrop" onClick={() => setOpen(false)}>
            <div
              className="support-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="support-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="support-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
              <span className="support-icon" aria-hidden="true">
                💬
              </span>
              <h2 id="support-title">Help &amp; Support</h2>
              <p>
                {topic
                  ? `Need help with ${topic.toLowerCase()}? Message us and we'll sort it out.`
                  : "Questions, a problem with an account, booking or deal? We're here to help."}
              </p>

              <a
                className="support-option is-whatsapp"
                href={supportWhatsAppUrl(whatsappText)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">🟢</span>
                <div>
                  <strong>Chat on WhatsApp</strong>
                  <small>Usually the fastest reply</small>
                </div>
              </a>

              <a className="support-option" href={supportMailto(subject)}>
                <span aria-hidden="true">✉️</span>
                <div>
                  <strong>Email us</strong>
                  <small>{SUPPORT_EMAIL}</small>
                </div>
              </a>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
