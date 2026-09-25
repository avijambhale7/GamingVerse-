/* =========================================================
   PURCHASE REQUEST CARD
   One marketplace request, shown to the buyer, seller or admin
   with the actions that role may take. Once the seller accepts,
   buyer and seller (and admin) see each other's mobile number.
========================================================= */

import { useEffect, useState } from "react";
import {
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
  REQUEST_STEPS,
  adminDecide,
  cancelPurchaseRequest,
  formatPhone,
  getRequestContacts,
  isOpenRequest,
  normalizePhone,
  requestStepIndex,
  sellerDecide,
} from "../utils/purchaseRequests.js";
import "./PurchaseRequestCard.css";

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function ContactLine({ label, name, phone }) {
  const digits = normalizePhone(phone);
  return (
    <div className="prc-contact">
      <span className="prc-contact-avatar" aria-hidden="true">
        {String(name || "?").trim().charAt(0).toUpperCase()}
      </span>
      <div className="prc-contact-info">
        <small>{label}</small>
        <strong>{name}</strong>
        <span>{digits ? formatPhone(digits) : "Number not available"}</span>
      </div>
      {digits && (
        <div className="prc-contact-actions">
          <a href={`tel:+91${digits}`}>📞 Call</a>
          <a
            href={`https://wa.me/91${digits}`}
            target="_blank"
            rel="noreferrer"
          >
            💬 WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

export default function PurchaseRequestCard({ request, role, onMessage }) {
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState(null);
  const accepted = request.status === REQUEST_STATUS.ACCEPTED;

  useEffect(() => {
    if (!accepted) return undefined;
    let alive = true;
    getRequestContacts(request.id)
      .then((data) => alive && setContacts(data))
      .catch((error) => {
        console.error("Contact load error:", error);
        if (alive) setContacts({});
      });
    return () => {
      alive = false;
    };
  }, [accepted, request.id]);

  const run = async (action, doneText) => {
    setBusy(true);
    try {
      await action();
      onMessage?.(doneText);
    } catch (error) {
      console.error(error);
      onMessage?.(error.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  // Steps fully completed: "Requested" is always done.
  const doneCount = accepted ? 3 : requestStepIndex(request.status) + 1;
  const ended =
    request.status === REQUEST_STATUS.ADMIN_REJECTED ||
    request.status === REQUEST_STATUS.SELLER_REJECTED ||
    request.status === REQUEST_STATUS.CANCELLED;

  return (
    <article className={`prc-card prc-${request.status}`}>
      <div className="prc-media">
        {request.productImage ? (
          <img src={request.productImage} alt="" />
        ) : (
          <span aria-hidden="true">
            {request.productType === "accessory" ? "🖱" : "🎮"}
          </span>
        )}
      </div>

      <div className="prc-body">
        <div className="prc-head">
          <h3>{request.productName}</h3>
          <span className="prc-status">
            {REQUEST_STATUS_LABEL[request.status] || request.status}
          </span>
        </div>

        <div className="prc-meta">
          <span>
            {request.quantity} × {money(request.price)} ={" "}
            <b>{money(request.total)}</b>
          </span>
          {role !== "buyer" && <span>🙋 Buyer: {request.buyerName}</span>}
          {role !== "seller" && <span>🏪 Seller: {request.sellerName}</span>}
          <span>
            🕐{" "}
            {new Date(request.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>

        {request.note && <p className="prc-note">“{request.note}”</p>}

        <ol className="prc-steps">
          {REQUEST_STEPS.map((label, index) => {
            const state =
              index < doneCount
                ? "done"
                : index === doneCount
                  ? ended
                    ? "failed"
                    : "current"
                  : "";
            return (
              <li key={label} className={state}>
                <i aria-hidden="true">
                  {state === "done" ? "✓" : state === "failed" ? "✕" : index + 1}
                </i>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>

        {accepted && contacts && (
          <div className="prc-contacts">
            {(role === "buyer" || role === "admin") && (
              <ContactLine
                label="Seller"
                name={request.sellerName}
                phone={contacts.sellerPhone}
              />
            )}
            {(role === "seller" || role === "admin") && (
              <ContactLine
                label="Buyer"
                name={request.buyerName}
                phone={contacts.buyerPhone}
              />
            )}
          </div>
        )}

        <div className="prc-actions">
          {role === "buyer" && isOpenRequest(request.status) && (
            <button
              type="button"
              className="prc-btn danger"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Cancel this request?"))
                  run(() => cancelPurchaseRequest(request), "Request cancelled.");
              }}
            >
              Cancel request
            </button>
          )}

          {role === "admin" &&
            request.status === REQUEST_STATUS.PENDING_ADMIN && (
              <>
                <button
                  type="button"
                  className="prc-btn approve"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => adminDecide(request, true),
                      "Approved — sent to the seller.",
                    )
                  }
                >
                  ✓ Approve
                </button>
                <button
                  type="button"
                  className="prc-btn danger"
                  disabled={busy}
                  onClick={() =>
                    run(() => adminDecide(request, false), "Request rejected.")
                  }
                >
                  ✕ Reject
                </button>
              </>
            )}

          {role === "seller" &&
            request.status === REQUEST_STATUS.PENDING_SELLER && (
              <>
                <button
                  type="button"
                  className="prc-btn approve"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => sellerDecide(request, true),
                      "Accepted — you can now contact the buyer.",
                    )
                  }
                >
                  ✓ Accept
                </button>
                <button
                  type="button"
                  className="prc-btn danger"
                  disabled={busy}
                  onClick={() =>
                    run(() => sellerDecide(request, false), "Request declined.")
                  }
                >
                  ✕ Decline
                </button>
              </>
            )}
        </div>
      </div>
    </article>
  );
}
