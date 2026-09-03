import React, { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [modal, setModal] = useState(null);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("gamingVerseEmail");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        localStorage.setItem("gamingVerseEmail", email);
      } else {
        localStorage.removeItem("gamingVerseEmail");
      }

      alert("Login successful!");
      navigate("/games");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/invalid-credential") {
        alert("Invalid email or password.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.");
      } else {
        alert("Login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (
      !signupName.trim() ||
      !signupEmail.trim() ||
      !signupPassword ||
      !signupConfirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (signupPassword.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      alert("Passwords do not match.");
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

      alert("Account created successfully!");

      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setModal(null);

      navigate("/games");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        alert("Password is too weak.");
      } else {
        alert("Account creation failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      alert("Enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());

      alert("Password reset email sent!\n\nCheck your inbox.");

      setResetEmail("");
      setModal(null);
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        alert("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.");
      } else {
        alert("Could not send reset email: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      alert("Google login successful!");
      navigate("/games");
    } catch (error) {
      console.error(error);

      if (error.code !== "auth/popup-closed-by-user") {
        alert("Google login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
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

              <button type="submit" className="modal-submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
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
