import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  BANNED_MESSAGE,
  consumeBannedNotice,
  hasBannedNotice,
  isUserBanned,
} from "../utils/ban.js";
import { isValidPhone, normalizePhone } from "../utils/purchaseRequests.js";
import "./Login.css";

/* Load all game images from src/assets/horizontal */
const gameImageModules = import.meta.glob(
  "../assets/horizontal/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const gameImages = Object.values(gameImageModules);

function Login() {
  const navigate = useNavigate();

  // Seed from the remembered address on the first render so the field does
  // not flash empty before the effect runs.
  const [email, setEmail] = useState(
    () => localStorage.getItem("gamingVerseEmail") || "",
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("gamingVerseEmail")),
  );
  const [showPassword, setShowPassword] = useState(false);

  const [modal, setModal] = useState(null);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupDob, setSignupDob] = useState("");

  const [ownerSignupName, setOwnerSignupName] = useState("");
  const [ownerSignupEmail, setOwnerSignupEmail] = useState("");
  const [ownerSignupPhone, setOwnerSignupPhone] = useState("");
  const [ownerSignupPassword, setOwnerSignupPassword] = useState("");
  const [ownerSignupConfirmPassword, setOwnerSignupConfirmPassword] =
    useState("");
  const [ownerSignupRole, setOwnerSignupRole] = useState("cafe_owner");
  const [ownerSignupBusinessName, setOwnerSignupBusinessName] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(() =>
    hasBannedNotice() ? { text: BANNED_MESSAGE, type: "error" } : null,
  );

  const notify = (text, type = "info") => {
    setNotice({ text, type });
    window.clearTimeout(window.gvLoginNoticeTimer);
    window.gvLoginNoticeTimer = window.setTimeout(
      () => setNotice(null),
      4000,
    );
  };

  // Clear App's forced-sign-out flag once the ban notice has been shown,
  // and let that notice fade like any other.
  useEffect(() => {
    if (!consumeBannedNotice()) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      notify("Please enter email and password.", "error");
      return;
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (await isUserBanned(cred.user.uid)) {
        await signOut(auth);
        consumeBannedNotice(); // App may have flagged it too
        notify(BANNED_MESSAGE, "error");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("gamingVerseEmail", email);
      } else {
        localStorage.removeItem("gamingVerseEmail");
      }

      const { ref, get } = await import("firebase/database");
      const { db } = await import("../firebase");
      const roleSnap = await get(ref(db, `users/${cred.user.uid}/role`));
      const role = String(roleSnap.val() || "").toLowerCase();
      const ownerRoles = new Set([
        "owner",
        "cafe_owner",
        "shop_owner",
        "accessory_owner",
      ]);

      notify("Login successful!", "success");
      setTimeout(() => {
        navigate(
          role === "admin"
            ? "/admin"
            : ownerRoles.has(role)
              ? "/owner-dashboard"
              : "/games",
        );
      }, 600);
    } catch (error) {
      console.error(error);

      if (consumeBannedNotice()) {
        notify(BANNED_MESSAGE, "error");
      } else if (error.code === "auth/invalid-credential") {
        notify("Invalid email or password.", "error");
      } else if (error.code === "auth/invalid-email") {
        notify("Invalid email address.", "error");
      } else {
        notify("Login failed: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;

    const birthDate = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const beforeBirthday =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate());

    if (beforeBirthday) {
      age -= 1;
    }

    return age;
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (
      !signupName.trim() ||
      !signupEmail.trim() ||
      !signupPhone.trim() ||
      !signupPassword ||
      !signupConfirmPassword
    ) {
      notify("Please fill all fields.", "error");
      return;
    }

    if (!isValidPhone(signupPhone)) {
      notify("Enter a valid 10-digit mobile number.", "error");
      return;
    }

    if (signupPassword.length < 6) {
      notify("Password must contain at least 6 characters.", "error");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      notify("Passwords do not match.", "error");
      return;
    }

    if (!signupDob) {
      notify("Please select your date of birth.", "error");
      return;
    }

    const signupAge = calculateAge(signupDob);

    if (signupAge === null || signupAge < 0 || signupAge > 120) {
      notify("Please enter a valid date of birth.", "error");
      return;
    }

    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword,
      );

      await updateProfile(result.user, {
        displayName: signupName.trim(),
      });

      // Save DOB so GamingVerse can enforce age-based game access.
      const { ref, set } = await import("firebase/database");
      const { db } = await import("../firebase");

      await set(ref(db, `users/${result.user.uid}`), {
        firstName: signupName.trim().split(" ")[0] || signupName.trim(),
        lastName: signupName.trim().split(" ").slice(1).join(" "),
        username: signupName.trim(),
        email: signupEmail.trim(),
        phone: normalizePhone(signupPhone),
        dob: signupDob,
        age: signupAge,
        createdAt: Date.now(),
      });

      notify("Account created successfully!", "success");

      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupPhone("");
      setSignupDob("");
      setModal(null);

      setTimeout(() => navigate("/games"), 600);
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        notify("This email is already registered.", "error");
      } else if (error.code === "auth/invalid-email") {
        notify("Invalid email address.", "error");
      } else if (error.code === "auth/weak-password") {
        notify("Password is too weak.", "error");
      } else {
        notify("Account creation failed: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerSignup = async (e) => {
    e.preventDefault();

    if (
      !ownerSignupName.trim() ||
      !ownerSignupEmail.trim() ||
      !ownerSignupPhone.trim() ||
      !ownerSignupPassword ||
      !ownerSignupConfirmPassword
    ) {
      notify("Please fill all fields.", "error");
      return;
    }

    if (!isValidPhone(ownerSignupPhone)) {
      notify("Enter a valid 10-digit mobile number.", "error");
      return;
    }

    if (ownerSignupPassword.length < 6) {
      notify("Password must contain at least 6 characters.", "error");
      return;
    }

    if (ownerSignupPassword !== ownerSignupConfirmPassword) {
      notify("Passwords do not match.", "error");
      return;
    }

    if (ownerSignupRole === "shop_owner" && !ownerSignupBusinessName.trim()) {
      notify("Enter your shop or business name.", "error");
      return;
    }

    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        ownerSignupEmail.trim(),
        ownerSignupPassword,
      );

      await updateProfile(result.user, {
        displayName: ownerSignupName.trim(),
      });

      const { ref, set } = await import("firebase/database");
      const { db } = await import("../firebase");

      await set(ref(db, `users/${result.user.uid}`), {
        firstName: ownerSignupName.trim().split(" ")[0] || ownerSignupName.trim(),
        lastName: ownerSignupName.trim().split(" ").slice(1).join(" "),
        username: ownerSignupName.trim(),
        email: ownerSignupEmail.trim(),
        phone: normalizePhone(ownerSignupPhone),
        role: ownerSignupRole,
        businessName:
          ownerSignupRole === "shop_owner"
            ? ownerSignupBusinessName.trim()
            : "",
        createdAt: Date.now(),
      });

      notify(
        ownerSignupRole === "cafe_owner"
          ? "Business account created! List your café from the dashboard next."
          : "Business account created! Taking you to your dashboard.",
        "success",
      );

      setOwnerSignupName("");
      setOwnerSignupEmail("");
      setOwnerSignupPhone("");
      setOwnerSignupPassword("");
      setOwnerSignupConfirmPassword("");
      setOwnerSignupBusinessName("");
      setModal(null);

      setTimeout(() => navigate("/owner-dashboard"), 600);
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        notify(
          "This email is already registered. Log in above instead.",
          "error",
        );
      } else if (error.code === "auth/invalid-email") {
        notify("Invalid email address.", "error");
      } else if (error.code === "auth/weak-password") {
        notify("Password is too weak.", "error");
      } else {
        notify("Account creation failed: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      notify("Enter your email address.", "error");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());

      notify("Password reset email sent — check your inbox.", "success");

      setResetEmail("");
      setModal(null);
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        notify("No account found with this email.", "error");
      } else if (error.code === "auth/invalid-email") {
        notify("Invalid email address.", "error");
      } else {
        notify("Could not send reset email: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      const cred = await signInWithPopup(auth, provider);

      if (await isUserBanned(cred.user.uid)) {
        await signOut(auth);
        consumeBannedNotice(); // App may have flagged it too
        notify(BANNED_MESSAGE, "error");
        return;
      }

      notify("Google login successful!", "success");
      setTimeout(() => navigate("/games"), 600);
    } catch (error) {
      console.error(error);

      if (consumeBannedNotice()) {
        notify(BANNED_MESSAGE, "error");
      } else if (error.code !== "auth/popup-closed-by-user") {
        notify("Google login failed: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {notice && (
        <div className={`login-toast ${notice.type}`} role="status">
          <span className="login-toast-icon">
            {notice.type === "success"
              ? "✓"
              : notice.type === "error"
                ? "⚠"
                : "ℹ"}
          </span>
          <span>{notice.text}</span>
        </div>
      )}

      {/* Flowing game background */}
      <div className="game-background">
        <div className="image-row row-1">
          {gameImages.map((image, index) => (
            <img src={image} alt="Gaming" key={`row1-${index}`} />
          ))}
          {gameImages.map((image, index) => (
            <img src={image} alt="Gaming" key={`row1-copy-${index}`} />
          ))}
        </div>

        <div className="image-row row-2">
          {gameImages.map((image, index) => (
            <img src={image} alt="Gaming" key={`row2-${index}`} />
          ))}
          {gameImages.map((image, index) => (
            <img src={image} alt="Gaming" key={`row2-copy-${index}`} />
          ))}
        </div>

        <div className="image-row row-3">
          {gameImages.map((image, index) => (
            <img src={image} alt="Gaming" key={`row3-${index}`} />
          ))}
          {gameImages.map((image, index) => (
            <img src={image} alt="Gaming" key={`row3-copy-${index}`} />
          ))}
        </div>
      </div>

      <div className="background-overlay"></div>

      {/* Login card */}
      <div className="login-card">
        <div className="game-icon">🎮</div>

        <h1 className="login-title">Welcome</h1>

        <p className="login-subtitle">Login to your GamingVerse account</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email or Username</label>

            <div className="input-wrapper">
              <span className="input-icon">👤</span>

              <input
                type="email"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="input-wrapper">
              <span className="input-icon">🔒</span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-password"
              onClick={() => setModal("forgot")}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Please wait..." : "Login"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="or-section">
          <div></div>
          <span>OR</span>
          <div></div>
        </div>

        <button
          type="button"
          className="social-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span>🌐</span>
          Continue with Google
        </button>

        <p className="create-account">
          Don't have an account?
          <button type="button" onClick={() => setModal("create")}>
            Create Account
          </button>
        </p>

        <div className="login-footer-divider">
          <span>Own a café or shop?</span>
        </div>

        <button
          type="button"
          className="business-account-button"
          onClick={() => setModal("owner-create")}
        >
          <span>☕🖱</span>
          Create Business Account
        </button>
      </div>

      {/* Create account modal */}
      {modal === "create" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-icon">🎮</div>

            <h2>Create Account</h2>
            <p>Join GamingVerse today</p>

            <form onSubmit={handleCreateAccount}>
              <input
                type="text"
                placeholder="Your Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                autoComplete="name"
                required
              />

              <input
                type="email"
                placeholder="Email address"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <input
                type="tel"
                inputMode="numeric"
                placeholder="Mobile number (10 digits)"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                autoComplete="tel-national"
                maxLength={14}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <div className="signup-dob-field">
                <label htmlFor="signup-dob">Date of Birth</label>
                <input
                  id="signup-dob"
                  type="date"
                  value={signupDob}
                  onChange={(e) => setSignupDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
                <small>Used only to apply GamingVerse age restrictions.</small>
              </div>

              <button type="submit" className="modal-submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Business owner signup modal */}
      {modal === "owner-create" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-icon">☕🖱</div>

            <h2>Create Business Account</h2>
            <p>List your café or shop on GamingVerse</p>

            <form onSubmit={handleOwnerSignup}>
              <div className="owner-signup-role-toggle">
                <button
                  type="button"
                  className={ownerSignupRole === "cafe_owner" ? "active" : ""}
                  onClick={() => setOwnerSignupRole("cafe_owner")}
                >
                  ☕ Café Owner
                </button>
                <button
                  type="button"
                  className={ownerSignupRole === "shop_owner" ? "active" : ""}
                  onClick={() => setOwnerSignupRole("shop_owner")}
                >
                  🖱 Accessories Shop
                </button>
              </div>

              <input
                type="text"
                placeholder="Your Name"
                value={ownerSignupName}
                onChange={(e) => setOwnerSignupName(e.target.value)}
                autoComplete="name"
                required
              />

              <input
                type="email"
                placeholder="Business email address"
                value={ownerSignupEmail}
                onChange={(e) => setOwnerSignupEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <input
                type="tel"
                inputMode="numeric"
                placeholder="Mobile number (10 digits)"
                value={ownerSignupPhone}
                onChange={(e) => setOwnerSignupPhone(e.target.value)}
                autoComplete="tel-national"
                maxLength={14}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={ownerSignupPassword}
                onChange={(e) => setOwnerSignupPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={ownerSignupConfirmPassword}
                onChange={(e) =>
                  setOwnerSignupConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
                minLength={6}
                required
              />

              {ownerSignupRole === "cafe_owner" ? (
                <p className="owner-signup-hint">
                  You'll list your café's name, address and details from the
                  dashboard right after signing up.
                </p>
              ) : (
                <input
                  type="text"
                  placeholder="Shop / business name"
                  value={ownerSignupBusinessName}
                  onChange={(e) =>
                    setOwnerSignupBusinessName(e.target.value)
                  }
                  required
                />
              )}

              <button type="submit" className="modal-submit" disabled={loading}>
                {loading ? "Creating..." : "Create Business Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot password modal */}
      {modal === "forgot" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-icon">🔑</div>

            <h2>Reset Password</h2>

            <p>Enter your email and we'll send you a password reset link.</p>

            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <button type="submit" className="modal-submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Email"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
