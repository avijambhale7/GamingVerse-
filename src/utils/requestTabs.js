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
  reported: "⚑ Reported",
  all: "All",
};

// Admins get an "Approved" tab for requests they approved that are now
// waiting on the seller — before, those only showed under "All".
// `reports`: show the admin's "Reported" tab (requests with open
// problem reports; needs purchaseReports passed to the list).
export function requestTabsFor(role, { reports = false } = {}) {
  const ids =
    role === "admin"
      ? ["open", "approved", "accepted", "closed", ...(reports ? ["reported"] : []), "all"]
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
  if (tab === "all") return true;
  // A filter across statuses, not a status of its own.
  if (tab === "reported") return Number(request?.openReports) > 0;
  return requestTabOf(request, role) === tab;
}

const updatedTime = (request) =>
  Number(request?.updatedAt || request?.createdAt || 0) || 0;

// The tab to open first: the one holding the most recently updated
// request (so a fresh change is right there), "All" when that can't be
// worked out, and never a tab with nothing in it while another has items.
export function initialRequestTab(requests = [], role) {
  const list = Array.isArray(requests) ? requests.filter(Boolean) : [];
  if (!list.length) return "open";
  const latest = list.reduce((best, request) =>
    updatedTime(request) > updatedTime(best) ? request : best,
  );
  if (!updatedTime(latest)) return "all";
  const tab = requestTabOf(latest, role);
  const known = requestTabsFor(role).some((item) => item.id === tab);
  return known && list.some((r) => requestMatchesTab(r, tab, role)) ? tab : "all";
}
