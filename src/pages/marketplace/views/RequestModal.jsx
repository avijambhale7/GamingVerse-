/* =========================================================
   REQUEST MODAL
   Buyer picks a quantity, adds an optional note and sends a
   purchase request. It goes to the admin first.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import { useEffect, useState } from "react";
import { money } from "../utils/format.js";
import {
  createPurchaseRequest,
  formatPhone,
  getMyPhone,
} from "../../../utils/purchaseRequests.js";

export default function RequestModal({ product, onClose, onSent }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const maxQty = Math.max(1, Number(product.stock || 0));

  useEffect(() => {
    getMyPhone()
      .then(setPhone)
      .catch(() => setPhone(""));
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await createPurchaseRequest({ product, quantity, note });
      onSent();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not send the request.");
      setSending(false);
    }
  };

  return (
    <div className="request-modal-backdrop" onClick={onClose}>
      <form
        className="request-modal"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
      >
        <button
          type="button"
          className="request-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <span className="request-modal-kicker">REQUEST TO BUY</span>
        <h3 id="request-modal-title">{product.name}</h3>

        <div className="request-modal-product">
          <div className="request-modal-thumb">
            {product.image ? <img src={product.image} alt="" /> : <span>🎮</span>}
          </div>
          <div>
            <small>Sold by {product.sellerName || "GamingVerse Seller"}</small>
            <strong>{money(product.price)}</strong>
            <span>{product.stock} in stock</span>
          </div>
        </div>

        <label className="request-modal-label">Quantity</label>
        <div className="request-qty">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <strong>{quantity}</strong>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="Increase quantity"
          >
            +
          </button>
          <span>
            Total <b>{money(Number(product.price || 0) * quantity)}</b>
          </span>
        </div>

        <label className="request-modal-label" htmlFor="request-note">
          Message to seller <em>(optional)</em>
        </label>
        <textarea
          id="request-note"
          rows="3"
          maxLength={300}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Is the price negotiable? When can I pick it up?"
        />

        <div className="request-modal-phone">
          📱 Your mobile <b>{phone ? formatPhone(phone) : "—"}</b> is shared
          with the seller only after they accept.
        </div>

        <ol className="request-modal-flow">
          <li>You send the request</li>
          <li>Admin approves it</li>
          <li>Seller accepts → you both get each other&apos;s number</li>
        </ol>

        {error && <div className="request-modal-error">{error}</div>}

        <button type="submit" className="primary-btn large" disabled={sending}>
          {sending ? "Sending..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}
