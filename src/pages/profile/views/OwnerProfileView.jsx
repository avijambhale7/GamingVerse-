/* =========================================================
   CAFÉ OWNER — BUSINESS PROFILE
   Rendered by ../../Profile.jsx.
========================================================= */

export default function OwnerProfileView({
  handleLogout,
  navigate,
  profile,
  setIsEditing,
  user,
}) {
  const ownerName =
    profile.businessName.trim() ||
    profile.cafeName.trim() ||
    user.displayName ||
    "Café Owner";

  return (
    <div className="cafe-owner-profile-page">
      <header className="cafe-owner-profile-header">
        <button
          type="button"
          className="cafe-owner-profile-brand"
          onClick={() => navigate("/games")}
        >
          <span className="cafe-owner-profile-brand-icon">☕</span>
          <span>
            <strong>GamingVerse Business</strong>
            <small>Café Owner Portal</small>
          </span>
        </button>

        <div className="cafe-owner-profile-header-actions">
          <span className="cafe-owner-role-pill">Café Owner</span>
          <button
            type="button"
            className="cafe-owner-dashboard-btn"
            onClick={() => navigate("/owner-dashboard")}
          >
            Owner Dashboard
          </button>
          <button
            type="button"
            className="cafe-owner-logout-btn"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="cafe-owner-profile-main">
        <section className="cafe-owner-profile-hero">
          <div className="cafe-owner-profile-identity">
            <div className="cafe-owner-profile-avatar">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={ownerName} />
              ) : (
                <span>☕</span>
              )}
            </div>

            <div>
              <span className="cafe-owner-profile-kicker">
                GAMINGVERSE BUSINESS
              </span>
              <h1>{ownerName}</h1>
              <p>{profile.cafeName || "Gaming Café"}</p>
              <span className="cafe-owner-verified-pill">
                ✓ Verified Café Owner
              </span>
            </div>
          </div>

          <button
            type="button"
            className="cafe-owner-edit-btn"
            onClick={() => setIsEditing(true)}
          >
            ✎ Edit Business Profile
          </button>
        </section>

        <section className="cafe-owner-profile-grid">
          <article className="cafe-owner-profile-card cafe-owner-about-card">
            <span className="cafe-owner-profile-kicker">
              ABOUT THE BUSINESS
            </span>
            <h2>{profile.cafeName || ownerName}</h2>
            <p>
              {profile.businessDescription ||
                "Gaming café profile. Add your café description from Edit Business Profile so customers can learn about your setup and services."}
            </p>
          </article>

          <article className="cafe-owner-profile-card">
            <span className="cafe-owner-profile-kicker">CAFÉ DETAILS</span>
            <div className="cafe-owner-detail-list">
              <div>
                <span>📍 Address</span>
                <strong>
                  {profile.businessAddress || "Add café address"}
                </strong>
              </div>
              <div>
                <span>📞 Contact</span>
                <strong>
                  {profile.businessPhone || "Add business contact"}
                </strong>
              </div>
              <div>
                <span>🕒 Opening Hours</span>
                <strong>
                  {profile.businessHours || "Add opening hours"}
                </strong>
              </div>
              <div>
                <span>🌐 Website</span>
                <strong>
                  {profile.businessWebsite || "No website added"}
                </strong>
              </div>
            </div>
          </article>

          <article className="cafe-owner-profile-card">
            <span className="cafe-owner-profile-kicker">
              BUSINESS ACTIONS
            </span>
            <div className="cafe-owner-action-grid">
              <button
                type="button"
                onClick={() => navigate("/owner-dashboard")}
              >
                <span>📅</span>
                <div>
                  <strong>Manage Bookings</strong>
                  <small>Confirm or cancel customer café bookings.</small>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate("/owner-dashboard")}
              >
                <span>🖱️</span>
                <div>
                  <strong>Sell Accessories</strong>
                  <small>
                    Add computer and gaming accessories to Marketplace.
                  </small>
                </div>
              </button>
            </div>
          </article>

          <article className="cafe-owner-profile-card">
            <span className="cafe-owner-profile-kicker">ACCOUNT</span>
            <div className="cafe-owner-account-row">
              <span>Owner Email</span>
              <strong>{user.email || "—"}</strong>
            </div>
            <div className="cafe-owner-account-row">
              <span>Account Type</span>
              <strong>Café Owner</strong>
            </div>
            <div className="cafe-owner-account-row">
              <span>Joined</span>
              <strong>
                {user.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    )
                  : "GamingVerse"}
              </strong>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
