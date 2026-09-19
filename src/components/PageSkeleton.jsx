import "./PageSkeleton.css";

/* =========================================================
   PAGE SKELETON
   Replaces the plain "Loading..." text every page showed
   while its first Firebase read was in flight. `variant`
   picks a shape close to what's about to render so the swap
   doesn't jump.
========================================================= */
export default function PageSkeleton({ variant = "grid" }) {
  return (
    <div className="page-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-bar skeleton-title" />
        <div className="skeleton-bar skeleton-subtitle" />
      </div>

      {variant === "grid" && (
        <div className="skeleton-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton-block skeleton-thumb" />
              <div className="skeleton-bar skeleton-line" />
              <div className="skeleton-bar skeleton-line short" />
            </div>
          ))}
        </div>
      )}

      {variant === "list" && (
        <div className="skeleton-list">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="skeleton-row" key={i}>
              <div className="skeleton-block skeleton-avatar" />
              <div className="skeleton-row-lines">
                <div className="skeleton-bar skeleton-line" />
                <div className="skeleton-bar skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
