/* =========================================================
   PURCHASE REQUEST LIST
   Live, filterable list of purchase requests for one role.
   Drop-in for the buyer's "My Requests", the seller's
   incoming requests and the admin moderation queue.
========================================================= */

import { useState } from "react";
import PurchaseRequestCard from "./PurchaseRequestCard.jsx";
import usePurchaseRequests from "../utils/usePurchaseRequests.js";
import {
  requestMatchesTab,
  requestTabLabel,
  requestTabOf,
  requestTabsFor,
} from "../utils/requestTabs.js";

const EMPTY_TEXT = {
  buyer: "Open any product and tap “Request to Buy”.",
  seller: "Requests approved by the admin will show up here.",
  admin: "New buyer requests will show up here for approval.",
};

// `data` lets a parent that already subscribed (for its own stats) pass the
// same { requests, error } in, instead of opening a second listener.
export default function PurchaseRequestList({
  role,
  uid,
  onMessage,
  data,
  emptyAction,
}) {
  const own = usePurchaseRequests(role, data ? "" : uid);
  const { requests, error } = data || own;
  const [filter, setFilter] = useState("open");
  // The request this user just acted on. When its new status moves it out
  // of the open tab, say where it went instead of letting it vanish.
  const [actedId, setActedId] = useState("");
  const tabs = requestTabsFor(role);

  const visible = requests.filter((r) => requestMatchesTab(r, filter, role));

  const acted = actedId ? requests.find((r) => r.id === actedId) : null;
  const movedTo =
    acted && filter !== "all" && !requestMatchesTab(acted, filter, role)
      ? requestTabOf(acted, role)
      : "";

  const openTab = (tab) => {
    setFilter(tab);
    setActedId("");
  };

  return (
    <div className="prc-wrap">
      <div className="prc-filters" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`is-${item.id}${filter === item.id ? " active" : ""}`}
            onClick={() => openTab(item.id)}
          >
            <i aria-hidden="true" />
            {item.label}
            <b>
              {requests.filter((r) => requestMatchesTab(r, item.id, role)).length}
            </b>
          </button>
        ))}
      </div>

      {movedTo && (
        <div className="prc-moved" role="status">
          <span>
            ✓ Moved to <strong>{requestTabLabel(movedTo)}</strong>
          </span>
          <button type="button" onClick={() => openTab(movedTo)}>
            View
          </button>
          <button
            type="button"
            className="prc-moved-close"
            aria-label="Dismiss"
            onClick={() => setActedId("")}
          >
            ×
          </button>
        </div>
      )}

      {error ? (
        <div className="prc-empty">
          <span>⚠️</span>
          <strong>{error}</strong>
        </div>
      ) : visible.length === 0 ? (
        <div className="prc-empty">
          <span>📭</span>
          <strong>
            {requests.length === 0 ? "No requests yet" : "Nothing in this tab"}
          </strong>
          <p>
            {requests.length === 0
              ? EMPTY_TEXT[role]
              : "Try another filter above."}
          </p>
          {emptyAction && requests.length === 0 && (
            <button
              type="button"
              className="prc-empty-action"
              onClick={emptyAction.onClick}
            >
              {emptyAction.label}
            </button>
          )}
        </div>
      ) : (
        <div className="prc-list">
          {visible.map((request) => (
            <PurchaseRequestCard
              key={request.id}
              request={request}
              role={role}
              onMessage={onMessage}
              onActed={() => setActedId(request.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
