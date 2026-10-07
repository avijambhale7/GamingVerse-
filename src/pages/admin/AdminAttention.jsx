/* =========================================================
   ADMIN — "NEEDS YOUR ATTENTION"
   One box at the top of the Overview with what's waiting on
   an admin; each line opens the tab where it's handled.
   Rendered by ../Admin.jsx.
========================================================= */

export default function AdminAttention({ items, onOpen }) {
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
              <span className="admin-attention-label">{item.label}</span>
              <strong>{item.count}</strong>
              <em aria-hidden="true">›</em>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
