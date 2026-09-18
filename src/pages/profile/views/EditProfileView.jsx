/* =========================================================
   EDIT PROFILE PAGE
   Rendered by ../../Profile.jsx.
========================================================= */

export default function EditProfileView({
  handleEditChange,
  handleLogout,
  handlePhotoSelect,
  handleSave,
  message,
  navigate,
  photoFile,
  profile,
  profileAge,
  saving,
  setIsEditing,
}) {
  return (
    <div className="edit-profile-page">
      <aside className="edit-sidebar">
        <button
          className="edit-sidebar-logo"
          type="button"
          onClick={() => setIsEditing(false)}
        >
          <span className="edit-sidebar-logo-icon">🎮</span>
          <span>
            <strong>GamingVerse</strong>
            <small>Level up your gaming experience</small>
          </span>
        </button>

        <button className="edit-side-item active" type="button">
          <span>👤</span>
          Profile
        </button>

        <button
          className="edit-side-item"
          type="button"
          onClick={() => navigate("/games?view=collections")}
        >
          <span>🎮</span>
          My Library
        </button>

        <button
          className="edit-side-item"
          type="button"
          onClick={() => navigate("/games")}
        >
          <span>⌂</span>
          Home
        </button>

        <div className="edit-sidebar-bottom">
          <button
            className="edit-side-item logout-side"
            type="button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Log Out
          </button>
        </div>
      </aside>

      <main className="edit-profile-main">
        <div className="edit-profile-top">
          <button
            className="back-profile-button"
            type="button"
            onClick={() => setIsEditing(false)}
          >
            ← Back to Profile
          </button>

          <h1>Edit Profile</h1>
          <p>Update your GamingVerse profile information.</p>
        </div>

        <form className="edit-profile-card" onSubmit={handleSave}>
          <div className="edit-photo-section">
            <label
              className="upload-photo-button"
              htmlFor="profile-photo-upload"
            >
              <div className="large-profile-avatar">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" />
                ) : (
                  <span aria-hidden="true">📷</span>
                )}

                <div className="upload-photo-overlay" aria-hidden="true">
                  📷
                </div>
              </div>
            </label>

            <div className="edit-photo-copy">
              <h3>Profile photo</h3>
              <p>Upload a new profile photo</p>

              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                className="profile-file-input"
                onChange={handlePhotoSelect}
              />

              {photoFile && (
                <span className="selected-photo-name">{photoFile.name}</span>
              )}
            </div>
          </div>

          <div className="edit-divider" />

          <section className="edit-section">
            <h2>Personal Information</h2>

            <div className="edit-grid">
              <div className="edit-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleEditChange}
                  placeholder="First name"
                />
              </div>

              <div className="edit-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleEditChange}
                  placeholder="Last name"
                />
              </div>

              <div className="edit-field full-field">
                <label htmlFor="username">Username</label>

                <div className="username-input-wrap">
                  <span>@</span>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    value={profile.username}
                    onChange={handleEditChange}
                    placeholder="Username"
                  />
                </div>
              </div>

              <div className="edit-field full-field">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={profile.dob}
                  onChange={handleEditChange}
                />
              </div>

              <div className="edit-field full-field age-status-field">
                <label>GamingVerse Age Access</label>
                <div className="age-status-card">
                  {profileAge === null ? (
                    <>
                      <strong>Age not set</strong>
                      <span>
                        Add your date of birth to enable game age
                        restrictions.
                      </span>
                    </>
                  ) : profileAge < 16 ? (
                    <>
                      <strong>Under 16 · Protected Access</strong>
                      <span>16+ and 18+ games will be restricted.</span>
                    </>
                  ) : profileAge < 18 ? (
                    <>
                      <strong>16–17 · 16+ Access</strong>
                      <span>
                        Games rated 16+ are available; 18+ games remain
                        restricted.
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>18+ · Full Age Access</strong>
                      <span>
                        Access is based on each game's age rating and safety
                        status.
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="edit-field full-field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleEditChange}
                  placeholder="Tell the GamingVerse community about yourself..."
                  rows="5"
                  maxLength="300"
                />
                <small>{profile.bio.length}/300</small>
              </div>
            </div>
          </section>

          <div className="edit-divider" />

          <section className="edit-section">
            <h2>Social Links</h2>

            <div className="edit-grid">
              <div className="edit-field">
                <label htmlFor="instagram">Instagram</label>
                <input
                  id="instagram"
                  type="text"
                  name="instagram"
                  value={profile.instagram}
                  onChange={handleEditChange}
                  placeholder="@username"
                />
              </div>

              <div className="edit-field">
                <label htmlFor="twitter">Twitter / X</label>
                <input
                  id="twitter"
                  type="text"
                  name="twitter"
                  value={profile.twitter}
                  onChange={handleEditChange}
                  placeholder="@username"
                />
              </div>

              <div className="edit-field full-field">
                <label htmlFor="youtube">YouTube</label>
                <input
                  id="youtube"
                  type="text"
                  name="youtube"
                  value={profile.youtube}
                  onChange={handleEditChange}
                  placeholder="YouTube channel URL"
                />
              </div>
            </div>
          </section>

          {message && (
            <div
              className={
                message.includes("success")
                  ? "profile-message success"
                  : "profile-message error"
              }
            >
              {message}
            </div>
          )}

          <div className="edit-actions">
            <button
              type="button"
              className="cancel-profile-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-profile-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
