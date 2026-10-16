/* =========================================================
   SERVICE NOTICE
   One line telling the user an outside service (RAWG games,
   news, trailers, café map) couldn't load, what's being shown
   instead, and a "Try again" button. Used wherever a section
   would otherwise sit empty when that service fails.
========================================================= */
import "./ServiceNotice.css";

export default function ServiceNotice({
  message,
  onRetry,
  retrying = false,
  tone = "info", // "info" = showing a fallback, "error" = nothing to show
  className = "",
}) {
  if (!message) return null;
  return (
    <div
      className={`service-notice is-${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="service-notice-icon" aria-hidden="true">
        {tone === "error" ? "⚠️" : "ℹ️"}
      </span>
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={retrying}>
          {retrying ? "Trying…" : "↻ Try again"}
        </button>
      )}
    </div>
  );
}
