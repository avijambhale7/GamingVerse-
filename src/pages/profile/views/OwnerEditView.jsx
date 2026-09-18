/* =========================================================
   CAFÉ OWNER — EDIT BUSINESS PROFILE
   Rendered by ../../Profile.jsx.
========================================================= */

export default function OwnerEditView({
  handleEditChange,
  handlePhotoSelect,
  handleSave,
  message,
  navigate,
  profile,
  saving,
  setIsEditing,
}) {
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
            <small>Café Owner Profile</small>
          </span>
        </button>
        <button
          type="button"
          className="cafe-owner-profile-back"
          onClick={() => setIsEditing(false)}
        >
          ← Back to Business Profile
        </button>
      </header>

      <main className="cafe-owner-profile-main">
        <section className="cafe-owner-profile-edit-card">
          <div className="cafe-owner-profile-edit-hero">
            <div className="cafe-owner-profile-avatar large">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Café business" />
              ) : (
                <span>☕</span>
              )}
            </div>
            <div>
              <span className="cafe-owner-profile-kicker">
                BUSINESS ACCOUNT
              </span>
              <h1>Edit Café Profile</h1>
              <p>
                Manage the information customers see about your café business.
              </p>
            </div>
            <label
              className="cafe-owner-photo-upload"
              htmlFor="profile-photo-upload"
            >
              Change Photo
            </label>
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handlePhotoSelect}
            />
          </div>

          <form className="cafe-owner-profile-form" onSubmit={handleSave}>
            <div className="cafe-owner-field">
              <label htmlFor="businessName">Business Name</label>
              <input
                id="businessName"
                name="businessName"
                value={profile.businessName}
                onChange={handleEditChange}
                placeholder="Your gaming café name"
              />
            </div>

            <div className="cafe-owner-field">
              <label htmlFor="cafeName">Café Name</label>
              <input
                id="cafeName"
                name="cafeName"
                value={profile.cafeName}
                onChange={handleEditChange}
                placeholder="Café name shown to customers"
              />
            </div>

            <div className="cafe-owner-field">
              <label htmlFor="businessPhone">Contact Number</label>
              <input
                id="businessPhone"
                name="businessPhone"
                value={profile.businessPhone}
                onChange={handleEditChange}
                placeholder="Business phone number"
              />
            </div>

            <div className="cafe-owner-field">
              <label htmlFor="businessHours">Opening Hours</label>
              <input
                id="businessHours"
                name="businessHours"
                value={profile.businessHours}
                onChange={handleEditChange}
                placeholder="e.g. 10:00 AM – 11:00 PM"
              />
            </div>

            <div className="cafe-owner-field full">
              <label htmlFor="businessAddress">Café Address</label>
              <textarea
                id="businessAddress"
                name="businessAddress"
                value={profile.businessAddress}
                onChange={handleEditChange}
                placeholder="Full café address"
                rows="3"
              />
            </div>

            <div className="cafe-owner-field full">
              <label htmlFor="businessWebsite">Website</label>
              <input
                id="businessWebsite"
                name="businessWebsite"
                value={profile.businessWebsite}
                onChange={handleEditChange}
                placeholder="https://yourcafe.example"
              />
            </div>

            <div className="cafe-owner-field full">
              <label htmlFor="businessDescription">About Your Café</label>
              <textarea
                id="businessDescription"
                name="businessDescription"
                value={profile.businessDescription}
                onChange={handleEditChange}
                placeholder="Tell customers about your gaming café, PCs, consoles and services..."
                rows="5"
                maxLength="500"
              />
              <small>{profile.businessDescription.length}/500</small>
            </div>

            {message && (
              <div
                className={`cafe-owner-profile-message ${message.includes("successfully") ? "success" : "error"}`}
              >
                {message}
              </div>
            )}

            <div className="cafe-owner-profile-actions">
              <button
                type="button"
                className="cafe-owner-secondary-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cafe-owner-primary-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Business Profile"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
