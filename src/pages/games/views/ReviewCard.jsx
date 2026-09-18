/* =========================================================
   REVIEW CARD
   One community review: its verdict, optional text, likes,
   and the comment thread hanging off it.

   Its own component because each card keeps local state for
   the comment box, which should not re-render the whole
   review list on every keystroke.
   Rendered by ./GameDetailsModal.jsx.
========================================================= */

import { useState } from "react";
import { reviewOptions } from "../data/reviewOptions.js";

const COMMENT_LIMIT = 500;

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.6l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 12a7.5 7.5 0 0 1-10.9 6.7L4.5 20l1.3-4.4A7.5 7.5 0 1 1 20.5 12Z" />
    </svg>
  );
}

export default function ReviewCard({
  review,
  liked,
  currentUserId,
  formatReviewAge,
  onToggleLike,
  onDelete,
  onPostComment,
  onDeleteComment,
}) {
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const verdict = reviewOptions.find((option) => option.id === review.verdict);
  const comments = review.comments || [];

  const handlePostComment = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    const ok = await onPostComment(review.id, body);
    setPosting(false);
    if (ok) setDraft("");
  };

  return (
    <article
      className={`community-review-card${review.isMine ? " is-mine" : ""}`}
    >
      <div className="community-review-head">
        <div className="community-user">
          <div className="community-avatar">{review.initials}</div>
          <div>
            <strong>
              @{review.userName}
              {review.isMine && <em className="review-you-tag">You</em>}
            </strong>
            <span>{formatReviewAge(review.createdAt)}</span>
          </div>
        </div>
        <span className={`community-verdict-pill ${review.verdict}`}>
          {verdict?.label || "Review"}
        </span>
      </div>

      {/* A verdict on its own is a complete review, so the body is optional. */}
      {review.text && <p>{review.text}</p>}

      <div className="community-review-actions">
        <button
          type="button"
          className={liked ? "liked" : ""}
          aria-pressed={liked}
          aria-label={liked ? "Remove like" : "Like this review"}
          onClick={() => onToggleLike(review.id)}
        >
          <HeartIcon filled={liked} />
          {review.likes || 0}
        </button>

        <button
          type="button"
          className={showComments ? "is-active" : ""}
          aria-expanded={showComments}
          aria-label={
            showComments ? "Hide comments" : `Comments (${comments.length})`
          }
          onClick={() => setShowComments((open) => !open)}
        >
          <CommentIcon />
          {comments.length}
        </button>

        {review.isMine && (
          <button
            type="button"
            className="review-delete-button"
            onClick={() => onDelete(review.id)}
          >
            Delete
          </button>
        )}
      </div>

      {showComments && (
        <div className="review-comments">
          {comments.length > 0 && (
            <ul className="review-comment-list">
              {comments.map((comment) => (
                <li key={comment.id} className="review-comment">
                  <div className="community-avatar small">
                    {comment.initials}
                  </div>
                  <div className="review-comment-body">
                    <div className="review-comment-meta">
                      <strong>@{comment.userName}</strong>
                      <span>{formatReviewAge(comment.createdAt)}</span>
                      {(comment.userId === currentUserId || review.isMine) && (
                        <button
                          type="button"
                          className="review-comment-delete"
                          onClick={() => onDeleteComment(review.id, comment.id)}
                          aria-label="Delete comment"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p>{comment.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form className="review-comment-form" onSubmit={handlePostComment}>
            <input
              type="text"
              value={draft}
              maxLength={COMMENT_LIMIT}
              placeholder="Write a comment..."
              onChange={(event) => setDraft(event.target.value)}
              aria-label={`Comment on ${review.userName}'s review`}
            />
            <button type="submit" disabled={!draft.trim() || posting}>
              {posting ? "Posting..." : "Comment"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
