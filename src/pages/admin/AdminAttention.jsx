/* =========================================================
   ADMIN — "NEEDS YOUR ATTENTION"
   One box at the top of the Overview with what's waiting on
   an admin; each line opens the tab where it's handled.
   Rendered by ../Admin.jsx.
========================================================= */
import { useState } from "react";
import { waitingLabel } from "../../utils/systemStatus.js";

export default function AdminAttention({ items, onOpen }) {
  // Captured when the Overview opens; fine for "waiting 2 days".
  const [now] = useState(() => Date.now());
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section
      className={`admin-attention${total ? " has-items" : ""}`}
      aria-labelledby="admin-attention-title"
    >
      <div className="admin-attention-head">
        <h2 id="admin-attention-title">
          {total ? "Needs your attention" : "All caught up"}
        </h2>
        <span>{total ? `${total} waiting` : "Nothing waiting on you ✓"}</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={item.count ? "is-waiting" : ""}
              onClick={() => onOpen(item.section)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="admin-attention-label">
                {item.label}
                {item.count > 0 && waitingLabel(item.oldest, now) && (
                  <small>oldest: {waitingLabel(item.oldest, now)}</small>
                )}
              </span>
              <strong>{item.count}</strong>
              <em aria-hidden="true">›</em>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
