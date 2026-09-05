import React, { useEffect, useRef, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
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
  const [signupDob, setSignupDob] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);
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

    if (!signupDob) {
      alert("Please select your date of birth.");
      return;
    }

    const signupAge = calculateAge(signupDob);

    if (signupAge === null || signupAge < 0 || signupAge > 120) {
      alert("Please enter a valid date of birth.");
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
        dob: signupDob,
        age: signupAge,
        createdAt: Date.now(),
      });

      alert("Account created successfully!");

      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupDob("");
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

  const clearRecaptcha = () => {
    const verifier = recaptchaVerifierRef.current;

    if (verifier) {
      try {
        verifier.clear();
      } catch (error) {
        console.warn("Could not clear reCAPTCHA:", error);
      }
    }

    recaptchaVerifierRef.current = null;

    const container = document.getElementById("phone-recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  };

  const resetPhoneAuthState = () => {
    clearRecaptcha();
    setConfirmationResult(null);
    setVerificationCode("");
    setPhoneNumber("");
  };

  const setupRecaptcha = async () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const container = document.getElementById("phone-recaptcha-container");

    if (!container) {
      throw new Error("reCAPTCHA container is not available.");
    }

    // Prevent Firebase from seeing an already-rendered widget in this element.
    container.innerHTML = "";

    const verifier = new RecaptchaVerifier(auth, container, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        clearRecaptcha();
      },
    });

    recaptchaVerifierRef.current = verifier;

    try {
      await verifier.render();
    } catch (error) {
      try {
        verifier.clear();
      } catch {}
      recaptchaVerifierRef.current = null;
      container.innerHTML = "";
      throw error;
    }

    return verifier;
  };

  useEffect(() => {
    if (modal !== "phone") {
      clearRecaptcha();
    }

    return () => {
      clearRecaptcha();
    };
  }, [modal]);

  const handleSendPhoneCode = async (e) => {
    e.preventDefault();

    const cleanPhone = phoneNumber.trim().replace(/[\s()-]/g, "");

    if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      alert(
        "Enter a valid phone number with country code. Example: +919876543210",
      );
      return;
    }

    setLoading(true);

    try {
      const verifier = recaptchaVerifierRef.current || (await setupRecaptcha());
      const result = await signInWithPhoneNumber(auth, cleanPhone, verifier);

      setConfirmationResult(result);
      setVerificationCode("");
      alert("OTP sent successfully!");
    } catch (error) {
      console.error("Phone login error:", error);

      clearRecaptcha();

      if (error.code === "auth/invalid-phone-number") {
        alert("Invalid phone number.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many attempts. Please try again later.");
      } else if (error.code === "auth/operation-not-allowed") {
        alert("Phone authentication is not enabled in Firebase yet.");
      } else {
        alert("Could not send OTP: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e) => {
    e.preventDefault();

    if (!confirmationResult) {
      alert("Please request an OTP first.");
      return;
    }

    if (!/^\\d{6}$/.test(verificationCode.trim())) {
      alert("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      await confirmationResult.confirm(verificationCode.trim());
      alert("Mobile login successful!");
      resetPhoneAuthState();
      setModal(null);
      navigate("/games");
    } catch (error) {
      console.error("OTP verification error:", error);

      if (error.code === "auth/invalid-verification-code") {
        alert("Invalid OTP. Please check the code and try again.");
      } else if (error.code === "auth/code-expired") {
        alert("This OTP has expired. Request a new one.");
      } else {
        alert("OTP verification failed: " + error.message);
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

        <button
          type="button"
          className="social-button"
          onClick={() => {
            setModal("phone");
            setVerificationCode("");
          }}
          disabled={loading}
        >
          <span>📱</span>
          Continue with Mobile No.
        </button>

        <p className="create-account">
          Don't have an account?
          <button type="button" onClick={() => setModal("create")}>
            Create Account
          </button>
        </p>
      </div>

      {/* Mobile phone login modal */}
      {modal === "phone" && (
        <div className="modal-backdrop" onClick={resetPhoneAuthState}>
          <div
            className="auth-modal phone-auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => {
                resetPhoneAuthState();
                setModal(null);
              }}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-icon">📱</div>
            <h2>Continue with Mobile No.</h2>
            <p>
              {confirmationResult
                ? "Enter the 6-digit OTP sent to your mobile number."
                : "Enter your mobile number with country code."}
            </p>
            <div
              id="phone-recaptcha-container"
              className="phone-recaptcha-container"
              aria-hidden="true"
            />

            {!confirmationResult ? (
              <form onSubmit={handleSendPhoneCode}>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />

                <button
                  type="submit"
                  className="modal-submit"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneCode}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />

                <button
                  type="submit"
                  className="modal-submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>

                <button
                  type="button"
                  className="phone-resend-button"
                  onClick={() => {
                    clearRecaptcha();
                    setConfirmationResult(null);
                    setVerificationCode("");
                  }}
                  disabled={loading}
                >
                  Change Number / Resend OTP
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
