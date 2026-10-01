/* =========================================================
   CAFÉ REVIEWS
   cafeReviews/{cafeId}/{uid}: { rating 1–5, text, name,
   bookingId, createdAt }. Only someone with a Completed booking
   at the café can write one (enforced in database.rules.json).
   (summariseReviews / stars live in ../utils/reviews.js)
   - CafeReviewList: the list on a café's page
   - RateVisitModal: stars + comment after a completed visit
========================================================= */
import { useState } from "react";
import { ref, serverTimestamp, set } from "firebase/database";
import { db } from "../../../firebase";
import { stars } from "../utils/reviews.js";
import useEscapeKey from "../../../utils/useEscapeKey.js";

export function RatingBadge({ summary }) {
  if (!summary) return null;
  return (
    <span className="cafe-rating" title={`${summary.avg.toFixed(1)} out of 5`}>
      ★ {summary.avg.toFixed(1)} <small>({summary.count})</small>
    </span>
  );
}

export function CafeReviewList({ summary }) {
  return (
    <div className="cafe-reviews">
      <h3>
        Reviews <RatingBadge summary={summary} />
      </h3>
      {!summary ? (
        <p className="cafe-about-text">
          No reviews yet. Gamers can rate this café after a completed session.
        </p>
      ) : (
        summary.list.slice(0, 10).map((review) => (
          <article className="cafe-review" key={review.uid}>
            <header>
              <strong>{review.name || "Gamer"}</strong>
              <span
                className="cafe-stars"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {stars(review.rating)}
              </span>
            </header>
            {review.text && <p>{review.text}</p>}
          </article>
        ))
      )}
    </div>
  );
}

export function RateVisitModal({ booking, user, existing, onClose, onDone }) {
  const [rating, setRating] = useState(Number(existing?.rating) || 0);
  const [text, setText] = useState(existing?.text || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEscapeKey(onClose);

  async function submit() {
    if (!rating || saving) return;
    setSaving(true);
    setError("");
    try {
      await set(ref(db, `cafeReviews/${booking.cafeId}/${user.uid}`), {
        rating,
        text: text.trim().slice(0, 500),
        name: String(
          user.displayName || user.email?.split("@")[0] || "Gamer",
        ).slice(0, 80),
        bookingId: booking.id,
        createdAt: serverTimestamp(),
      });
      onDone?.();
      onClose();
    } catch (err) {
      console.error("Café review error:", err);
      setError(
        String(err?.message || "").includes("PERMISSION_DENIED")
          ? "Only completed bookings can be reviewed. If this one is completed, publish the latest database rules."
          : "Couldn't save your review. Please try again.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="cafe-rate-backdrop" onClick={onClose}>
      <div
        className="cafe-rate-modal"
        role="dialog"
        aria-label={`Rate ${booking.cafeName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Rate {booking.cafeName}</h3>
        <p>
          Your visit on {booking.date} at {booking.time}
        </p>
        <div className="cafe-star-picker" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className={n <= rating ? "on" : ""}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={text}
          maxLength={500}
          placeholder="How were the setups, staff and vibe? (optional)"
          onChange={(e) => setText(e.target.value)}
        />
        {error && <p className="cafe-rate-error">{error}</p>}
        <div className="cafe-rate-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            disabled={!rating || saving}
            onClick={submit}
          >
            {saving ? "Saving…" : existing ? "Update review" : "Post review"}
          </button>
        </div>
      </div>
    </div>
  );
}
