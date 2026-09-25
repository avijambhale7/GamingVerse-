/* =========================================================
   NOTIFICATION BELL
   Compact bell + dropdown for pages that don't have the Games
   navbar (Owner Dashboard, Admin, standalone Marketplace).
   `path` is the feed to show: "notifications/{uid}" for a user,
   "adminNotifications" for the shared admin feed.
========================================================= */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { limitToLast, onValue, query, ref, update } from "firebase/database";
import { db } from "../firebase";
import "./NotificationBell.css";

function timeAgo(timestamp) {
  const diff = Date.now() - Number(timestamp || 0);
  if (!timestamp || diff < 0) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell({ path }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);

  // The panel is portalled to <body> so a parent with overflow:hidden
  // (the dashboard hero headers) can't clip it and their button styles
  // don't leak in. Position it under the bell, kept inside the viewport.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 10,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!path) return undefined;
    return onValue(
      query(ref(db, path), limitToLast(50)),
      (snapshot) => {
        const data = snapshot.val() || {};
        setItems(
          Object.entries(data)
            .map(([id, item]) => ({ id, ...item }))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
        );
      },
      (error) => console.error("Notification bell listener error:", error),
    );
  }, [path]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (
        !wrapRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((item) => !item.read);

  const markRead = (id) =>
    update(ref(db, `${path}/${id}`), { read: true }).catch((error) =>
      console.error("Mark read failed:", error),
    );

  const markAllRead = () => {
    if (!unread.length) return;
    const patch = {};
    unread.forEach((item) => {
      patch[`${item.id}/read`] = true;
    });
    update(ref(db, path), patch).catch((error) =>
      console.error("Mark all read failed:", error),
    );
  };

  return (
    <div className="nb-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`nb-button${open ? " active" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}
        aria-expanded={open}
      >
        🔔
        {unread.length > 0 && (
          <span className="nb-badge">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
        <div
          className="nb-panel"
          role="dialog"
          aria-label="Notifications"
          ref={panelRef}
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="nb-head">
            <strong>Notifications</strong>
            {unread.length > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="nb-empty">
              <span>🔕</span>
              <p>You&apos;re all caught up.</p>
            </div>
          ) : (
            <div className="nb-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nb-item${item.read ? " is-read" : ""}`}
                  onClick={() => !item.read && markRead(item.id)}
                >
                  <span className="nb-icon" aria-hidden="true">
                    {item.title === "GamingVerse Market" ? "🛒" : "🔔"}
                  </span>
                  <span className="nb-copy">
                    <span>{item.message}</span>
                    <small>{timeAgo(item.createdAt)}</small>
                  </span>
                  {!item.read && <i className="nb-dot" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>,
          document.body,
        )}
    </div>
  );
}
