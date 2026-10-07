/* =========================================================
   DEAL PROBLEM REPORTS (pure — unit tested)
   purchaseReports/{requestId}/{uid} = {
     reason, message?, role ("buyer" | "seller"), createdAt, resolvedAt?
   }
   Filed by the buyer or seller of an accepted request; admins
   read them all and mark them resolved.
========================================================= */

export const REPORT_REASONS = [
  { id: "not_delivered", label: "Didn't deliver" },
  { id: "not_paid", label: "Didn't pay" },
  { id: "not_as_described", label: "Item not as described" },
  { id: "other", label: "Other" },
];

export const REPORT_MESSAGE_MAX = 500;

export const reportReasonLabel = (id) =>
  REPORT_REASONS.find((reason) => reason.id === id)?.label || "Other";

// Reports for one request, as a list (newest first).
export function reportsList(byUser = {}) {
  return Object.entries(byUser || {})
    .map(([uid, report]) => ({ uid, ...report }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

export const isOpenReport = (report) => Boolean(report) && !report.resolvedAt;

// Open (unresolved) reports for one request.
export const openReportCount = (byUser = {}) =>
  reportsList(byUser).filter(isOpenReport).length;

// purchaseReports (all requests) → number of open reports in total.
export function countOpenReports(all = {}) {
  return Object.values(all || {}).reduce(
    (sum, byUser) => sum + openReportCount(byUser),
    0,
  );
}

// Trimmed message, at most REPORT_MESSAGE_MAX characters.
export const cleanReportMessage = (text = "") =>
  String(text || "").trim().slice(0, REPORT_MESSAGE_MAX);
