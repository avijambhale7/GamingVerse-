/* =========================================================
   PURCHASE REQUEST TABS (pure — unit tested in requestTabs.test.js)
   Which tabs each role sees, and which tab a request belongs in.
   Status values match REQUEST_STATUS in purchaseRequests.js.
========================================================= */

const TAB_LABELS = {
  open: "Pending",
  approved: "Approved",
  accepted: "Accepted",
  closed: "Rejected / Cancelled",
  all: "All",
};

// Admins get an "Approved" tab for requests they approved that are now
// waiting on the seller — before, those only showed under "All".
export function requestTabsFor(role) {
  const ids =
    role === "admin"
      ? ["open", "approved", "accepted", "closed", "all"]
      : ["open", "accepted", "closed", "all"];
  return ids.map((id) => ({ id, label: TAB_LABELS[id] }));
}

export const requestTabLabel = (tab) => TAB_LABELS[tab] || "";

// The one tab (besides "All") a request appears in for this role.
export function requestTabOf(request, role) {
  const status = request?.status;
  if (status === "accepted") return "accepted";
  if (status === "pending_admin") {
    // Waiting on the admin: pending for admin and buyer. A seller never
    // sees these (they only get requests once approved).
    return "open";
  }
  if (status === "pending_seller") {
    // Admin already approved it: "Approved" for the admin; still
    // pending for the buyer, and the seller's turn to act.
    return role === "admin" ? "approved" : "open";
  }
  return "closed";
}

export function requestMatchesTab(request, tab, role) {
  return tab === "all" || requestTabOf(request, role) === tab;
}
