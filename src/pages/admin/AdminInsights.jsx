/* =========================================================
   ADMIN INSIGHTS
   Two quick-read bar charts for the Overview tab:
   - Most reviewed games (one series: the brand violet)
   - Café bookings by status (status colours, each bar labelled)
   Plain HTML bars, like the rest of the dashboard; every bar
   carries its label and value, so colour is never the only cue.
   Rendered by ../Admin.jsx.
========================================================= */

import { useMemo } from "react";
import "./AdminInsights.css";

const STATUS_ORDER = [
  { id: "Pending", tone: "warning", icon: "⏳" },
  { id: "Confirmed", tone: "info", icon: "✓" },
  { id: "Completed", tone: "good", icon: "★" },
  { id: "Cancelled", tone: "muted", icon: "✕" },
  { id: "Rejected", tone: "critical", icon: "!" },
];

function BarList({ rows, max, tone, unit }) {
  return (
    <ul className="ai-bars">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${row.value} ${unit}`}>
          <span className="ai-label">
            {row.icon && <i aria-hidden="true">{row.icon}</i>}
            {row.label}
          </span>
          <span className="ai-track">
            <span
              className={`ai-fill is-${row.tone || tone}`}
              style={{ width: `${max ? (row.value / max) * 100 : 0}%` }}
            />
          </span>
          <span className="ai-value">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminInsights({ reviews, bookings }) {
  const topGames = useMemo(() => {
    const tally = {};
    reviews.forEach((review) => {
      if (!review.verdict) return;
      tally[review.gameName] = (tally[review.gameName] || 0) + 1;
    });
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [reviews]);

  const byStatus = useMemo(() => {
    const tally = {};
    bookings
      .filter((booking) => !booking?.walkIn)
      .forEach((booking) => {
        const status = booking?.status || "Confirmed";
        tally[status] = (tally[status] || 0) + 1;
      });
    return STATUS_ORDER.map((s) => ({
      label: s.id,
      value: tally[s.id] || 0,
      tone: s.tone,
      icon: s.icon,
    }));
  }, [bookings]);

  return (
    <section className="ai-grid">
      <article className="ai-card">
        <h3>Most reviewed games</h3>
        <p>Games with the most verdicts from players.</p>
        {topGames.length ? (
          <BarList
            rows={topGames}
            max={topGames[0].value}
            tone="brand"
            unit="verdicts"
          />
        ) : (
          <p className="ai-empty">No verdicts yet.</p>
        )}
      </article>

      <article className="ai-card">
        <h3>Café bookings by status</h3>
        <p>All online bookings (walk-ins excluded).</p>
        {byStatus.some((row) => row.value) ? (
          <BarList
            rows={byStatus}
            max={Math.max(...byStatus.map((row) => row.value))}
            unit="bookings"
          />
        ) : (
          <p className="ai-empty">No bookings yet.</p>
        )}
      </article>
    </section>
  );
}
