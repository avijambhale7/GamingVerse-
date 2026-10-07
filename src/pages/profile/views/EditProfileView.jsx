/* =========================================================
   EDIT PROFILE PAGE
   Rendered by ../../Profile.jsx.
========================================================= */
import GVLogoMark from "../../../components/GVLogoMark.jsx";

export default function EditProfileView({
  handleEditChange,
  handleLogout,
  handlePhotoSelect,
  handleSave,
  message,
  photoFile,
  profile,
  profileAge,
  dobLocked = false,
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
          <span className="edit-sidebar-logo-icon gv-logo-host" aria-hidden="true">
            <GVLogoMark />
          </span>
          <span>
            <strong>
              Gaming<span>Verse</span>
            </strong>
          </span>
        </button>

        <button className="edit-side-item active" type="button">
          <span>👤</span>
          Profile
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
          <div className="edit-cover" aria-hidden="true" />
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
              <h3>
                {`${profile.firstName} ${profile.lastName}`.trim() ||
                  "Your name"}
              </h3>
              <p className="edit-handle">@{profile.username || "username"}</p>
              <label className="edit-photo-btn" htmlFor="profile-photo-upload">
                📷 {profile.photoURL || photoFile ? "Change photo" : "Upload photo"}
              </label>

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

          <section className="edit-section">
            <div className="edit-section-head">
              <span aria-hidden="true">👤</span>
              <div>
                <h2>Personal Information</h2>
                <p>How you appear to the GamingVerse community.</p>
              </div>
            </div>

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
                  readOnly={dobLocked}
                  disabled={dobLocked}
                  aria-describedby={dobLocked ? "dob-locked-note" : undefined}
                />
                {dobLocked && (
                  <small id="dob-locked-note">
                    Contact support to change your date of birth.
                  </small>
                )}
              </div>

              <div className="edit-field full-field age-status-field">
                <label>GamingVerse Age Access</label>
                <div
                  className={`age-status-card ${
                    profileAge === null
                      ? "is-unset"
                      : profileAge < 16
                        ? "is-protected"
                        : profileAge < 18
                          ? "is-teen"
                          : "is-full"
                  }`}
                >
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

          <section className="edit-section">
            <div className="edit-section-head is-social">
              <span aria-hidden="true">🔗</span>
              <div>
                <h2>Social Links</h2>
                <p>Optional — shown on your profile so gamers can find you.</p>
              </div>
            </div>

            <div className="edit-grid">
              <div className="edit-field">
                <label htmlFor="instagram">Instagram</label>
                <div className="social-input-wrap">
                  <span aria-hidden="true">📸</span>
                <input
                  id="instagram"
                  type="text"
                  name="instagram"
                  value={profile.instagram}
                  onChange={handleEditChange}
                  placeholder="@username"
                />
                </div>
              </div>

              <div className="edit-field">
                <label htmlFor="twitter">Twitter / X</label>
                <div className="social-input-wrap">
                  <span aria-hidden="true">𝕏</span>
                <input
                  id="twitter"
                  type="text"
                  name="twitter"
                  value={profile.twitter}
                  onChange={handleEditChange}
                  placeholder="@username"
                />
                </div>
              </div>

              <div className="edit-field full-field">
                <label htmlFor="youtube">YouTube</label>
                <div className="social-input-wrap">
                  <span aria-hidden="true">▶</span>
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

          <div className="edit-actions edit-actions-sticky">
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
