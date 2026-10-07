/* =========================================================
   DEAL PROBLEM REPORTS (on accepted purchase requests)
   Buyer / seller: "Report a problem" (reason + optional
   message) → purchaseReports/{requestId}/{uid}.
   Admin: the request's reports, with "Mark resolved".
   Rendered by ./PurchaseRequestCard.jsx.
========================================================= */

import { useEffect, useState } from "react";
import { get, ref, serverTimestamp, set, update } from "firebase/database";
import { auth, db } from "../firebase";
import { NOTIFY_TITLES, notifyAdmins } from "../utils/notify.js";
import {
  REPORT_MESSAGE_MAX,
  cleanReportMessage,
  reportReasonsFor,
  reportReasonLabel,
  reportsList,
} from "../utils/purchaseReports.js";

function timeLabel(ms) {
  return ms ? new Date(Number(ms)).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }) : "";
}

// Buyer or seller of an accepted deal.
export function ReportProblem({ request, role, onMessage }) {
  const uid = auth.currentUser?.uid || "";
  const [mine, setMine] = useState(undefined); // undefined = loading
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return undefined;
    let alive = true;
    get(ref(db, `purchaseReports/${request.id}/${uid}`))
      .then((snap) => alive && setMine(snap.val()))
      .catch(() => alive && setMine(null));
    return () => {
      alive = false;
    };
  }, [request.id, uid]);

  if (!uid || mine === undefined) return null;

  if (mine) {
    return (
      <p className={`prc-report-status${mine.resolvedAt ? " is-resolved" : ""}`}>
        ⚑ You reported: <strong>{reportReasonLabel(mine.reason)}</strong>
        {mine.resolvedAt ? " — resolved by GamingVerse" : " — our team will look into it"}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="prc-btn prc-report-btn"
        onClick={() => setOpen(true)}
      >
        ⚑ Report a problem
      </button>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (!reason) return;
    setSaving(true);
    try {
      const report = {
        reason,
        role,
        createdAt: serverTimestamp(),
        ...(cleanReportMessage(message) ? { message: cleanReportMessage(message) } : {}),
      };
      await set(ref(db, `purchaseReports/${request.id}/${uid}`), report);
      setMine({ ...report, createdAt: Date.now() });
      setOpen(false);
      notifyAdmins(
        `Deal problem reported (${reportReasonLabel(reason)}) on ${request.productName} — ${request.buyerName} ↔ ${request.sellerName}.`,
        NOTIFY_TITLES.admin,
      ).catch(() => {});
      onMessage?.("Thanks — our team will look into it.");
    } catch (error) {
      console.error("Report error:", error);
      onMessage?.("Couldn't send your report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="prc-report-form" onSubmit={submit}>
      <strong>What went wrong?</strong>
      <div className="prc-report-reasons" role="radiogroup" aria-label="Reason">
        {reportReasonsFor(role).map((item) => (
          <label key={item.id} className={reason === item.id ? "is-picked" : ""}>
            <input
              type="radio"
              name={`report-${request.id}`}
              value={item.id}
              checked={reason === item.id}
              onChange={() => setReason(item.id)}
            />
            {item.label}
          </label>
        ))}
      </div>
      <textarea
        rows="3"
        value={message}
        maxLength={REPORT_MESSAGE_MAX}
        placeholder="Tell us more (optional)"
        aria-label="Details (optional)"
        onChange={(e) => setMessage(e.target.value)}
      />
      <small>
        {message.length}/{REPORT_MESSAGE_MAX}
      </small>
      <div className="prc-report-actions">
        <button type="submit" className="prc-btn danger" disabled={!reason || saving}>
          {saving ? "Sending..." : "Send report"}
        </button>
        <button type="button" className="prc-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// Admin: every report on this request.
export function ReportList({ request, reports, onMessage }) {
  const list = reportsList(reports);
  if (!list.length) return null;

  const resolve = async (uid) => {
    try {
      await update(ref(db, `purchaseReports/${request.id}/${uid}`), {
        resolvedAt: serverTimestamp(),
      });
      onMessage?.("Report marked as resolved.");
    } catch (error) {
      console.error("Resolve report error:", error);
      onMessage?.("Couldn't update the report.");
    }
  };

  return (
    <ul className="prc-report-list" aria-label="Problem reports">
      {list.map((report) => (
        <li key={report.uid} className={report.resolvedAt ? "is-resolved" : ""}>
          <div>
            <strong>
              ⚑ {reportReasonLabel(report.reason)}
              <small>
                {" "}
                by {report.role === "seller" ? request.sellerName : request.buyerName}{" "}
                ({report.role === "seller" ? "seller" : "buyer"}) · {timeLabel(report.createdAt)}
              </small>
            </strong>
            {report.message && <p>{report.message}</p>}
          </div>
          {report.resolvedAt ? (
            <span className="prc-report-done">Resolved ✓</span>
          ) : (
            <button type="button" className="prc-btn" onClick={() => resolve(report.uid)}>
              Mark resolved
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
