import { useMemo, useRef, useState } from "react";
import "./AdminActivityChart.css";

/* =========================================================
   ADMIN ACTIVITY CHART
   Signups / bookings / purchase requests over the last 14 days. Plain
   SVG line chart — no charting library, consistent with the
   rest of the app. Colors are the dataviz skill's validated
   3-slot categorical palette (blue/orange/aqua), checked
   against GamingVerse's dark surface (#0e0e12).
========================================================= */

const SERIES = [
  { key: "signups", label: "Signups", color: "#3987e5" },
  { key: "bookings", label: "Café bookings", color: "#d95926" },
  { key: "requests", label: "Marketplace requests", color: "#199e70" },
];

const WIDTH = 720;
const HEIGHT = 260;
const PAD_LEFT = 34;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

function niceMax(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

export default function AdminActivityChart({ days }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxValue = useMemo(() => {
    const peak = days.reduce(
      (max, day) =>
        Math.max(max, day.signups, day.bookings, day.requests),
      0,
    );
    return niceMax(peak);
  }, [days]);

  const xFor = (index) =>
    PAD_LEFT +
    (days.length > 1 ? (index / (days.length - 1)) * plotWidth : plotWidth / 2);
  const yFor = (value) =>
    PAD_TOP + plotHeight - (value / maxValue) * plotHeight;

  const linePath = (key) =>
    days
      .map((day, index) => `${index === 0 ? "M" : "L"}${xFor(index)},${yFor(day[key])}`)
      .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
    Math.round(maxValue * fraction),
  );

  const handleMove = (event) => {
    const svg = svgRef.current;
    if (!svg || !days.length) return;
    const rect = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const step = days.length > 1 ? plotWidth / (days.length - 1) : plotWidth;
    const index = Math.round((pointerX - PAD_LEFT) / step);
    setHoverIndex(Math.min(days.length - 1, Math.max(0, index)));
  };

  const hoverDay = hoverIndex === null ? null : days[hoverIndex];
  const tooltipLeft = hoverIndex === null ? 0 : (xFor(hoverIndex) / WIDTH) * 100;
  const tooltipOnRight = tooltipLeft > 60;

  return (
    <div className="admin-activity-chart">
      <div className="admin-activity-legend">
        {SERIES.map((series) => (
          <span key={series.key} className="admin-activity-legend-item">
            <span
              className="admin-activity-legend-key"
              style={{ background: series.color }}
              aria-hidden="true"
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="admin-activity-chart-body">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="admin-activity-svg"
          role="img"
          aria-label="Signups, café bookings and marketplace requests over the last 14 days"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={yFor(tick)}
                y2={yFor(tick)}
                className="admin-activity-gridline"
              />
              <text
                x={PAD_LEFT - 8}
                y={yFor(tick)}
                className="admin-activity-axis-label"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick}
              </text>
            </g>
          ))}

          {days.map(
            (day, index) =>
              index % 2 === 0 && (
                <text
                  key={day.key}
                  x={xFor(index)}
                  y={HEIGHT - 10}
                  className="admin-activity-axis-label"
                  textAnchor="middle"
                >
                  {day.label}
                </text>
              ),
          )}

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              className="admin-activity-crosshair"
            />
          )}

          {SERIES.map((series) => (
            <path
              key={series.key}
              d={linePath(series.key)}
              fill="none"
              stroke={series.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hoverIndex !== null &&
            SERIES.map((series) => (
              <circle
                key={series.key}
                cx={xFor(hoverIndex)}
                cy={yFor(days[hoverIndex][series.key])}
                r={5}
                fill={series.color}
                className="admin-activity-dot"
              />
            ))}
        </svg>

        {hoverDay && (
          <div
            className={`admin-activity-tooltip ${tooltipOnRight ? "align-right" : "align-left"}`}
            style={{ left: `${tooltipLeft}%` }}
          >
            <strong>{hoverDay.label}</strong>
            {SERIES.map((series) => (
              <div key={series.key} className="admin-activity-tooltip-row">
                <span
                  className="admin-activity-tooltip-key"
                  style={{ background: series.color }}
                  aria-hidden="true"
                />
                <span className="admin-activity-tooltip-value">
                  {hoverDay[series.key]}
                </span>
                <span className="admin-activity-tooltip-label">
                  {series.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
