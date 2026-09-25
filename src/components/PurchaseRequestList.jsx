/* =========================================================
   PURCHASE REQUEST LIST
   Live, filterable list of purchase requests for one role.
   Drop-in for the buyer's "My Requests", the seller's
   incoming requests and the admin moderation queue.
========================================================= */

import { useState } from "react";
import PurchaseRequestCard from "./PurchaseRequestCard.jsx";
import usePurchaseRequests from "../utils/usePurchaseRequests.js";
import { REQUEST_STATUS, isOpenRequest } from "../utils/purchaseRequests.js";

const FILTERS = [
  { id: "open", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "closed", label: "Rejected / Cancelled" },
  { id: "all", label: "All" },
];

function matches(request, filter, role) {
  if (filter === "all") return true;
  if (filter === "accepted") return request.status === REQUEST_STATUS.ACCEPTED;
  if (filter === "open") {
    // "Pending" means waiting on *this* role where that makes sense.
    if (role === "admin") return request.status === REQUEST_STATUS.PENDING_ADMIN;
    if (role === "seller")
      return request.status === REQUEST_STATUS.PENDING_SELLER;
    return isOpenRequest(request.status);
  }
  return (
    !isOpenRequest(request.status) &&
    request.status !== REQUEST_STATUS.ACCEPTED
  );
}

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

  const visible = requests.filter((r) => matches(r, filter, role));

  return (
    <div className="prc-wrap">
      <div className="prc-filters" role="tablist">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`is-${item.id}${filter === item.id ? " active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            <i aria-hidden="true" />
            {item.label}
            <b>{requests.filter((r) => matches(r, item.id, role)).length}</b>
          </button>
        ))}
      </div>

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
            />
          ))}
        </div>
      )}
    </div>
  );
}
