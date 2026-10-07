import { useEffect, useEffectEvent, useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  BANNED_MESSAGE,
  consumeBannedNotice,
  hasBannedNotice,
  isUserBanned,
} from "../utils/ban.js";
import { isValidPhone, normalizePhone } from "../utils/purchaseRequests.js";
import {
  USERNAME_RULE_TEXT,
  claimUsername,
  releaseUsername,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
} from "../utils/usernames.js";
import {
  authErrorMessage,
  homePathFor,
  isEmailIdentifier,
  returnPathFrom,
} from "../utils/authFlow.js";
import useEscapeKey from "../utils/useEscapeKey.js";
import {
  POPUP_UNSUPPORTED_CODES,
  isInAppBrowser,
} from "../utils/inAppBrowser.js";
import { calculateAgeFromDob } from "./games/utils/access.js";
import PageLoading from "../components/PageLoading.jsx";
import { NOTIFY_TITLES, notifyAdmins } from "../utils/notify.js";
import "./Login.css";
import SupportLink from "../components/SupportLink.jsx";

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

// The profile (users/{uid}) that decides where a user lands.
async function readProfile(uid) {
  try {
    return (await get(ref(db, `users/${uid}`))).val() || {};
  } catch (error) {
    console.error("Profile read error:", error);
    return {};
  }
}

// An auth-style error ({ code }) so every failure goes through
// authErrorMessage().
const authError = (code) => Object.assign(new Error(code), { code });

/* Username login: /api/resolve-username checks the username and
   password on the server and returns a one-time sign-in token. Every
   failure (unknown username, wrong password…) is the same "invalid". */
async function usernameSignInToken(handle, password) {
  let response;
  try {
    response = await fetch("/api/resolve-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: handle, password }),
    });
  } catch {
    throw authError("auth/network-request-failed");
  }
  if (response.status === 429) throw authError("auth/too-many-requests");
  // 503 = the server isn't set up for username login; 5xx = it failed.
  // Neither means the password is wrong, so say so.
  if (response.status >= 500) {
    throw authError("app/username-login-unavailable");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.token) throw authError("auth/invalid-credential");
  return body.token;
}

// localStorage can throw (private mode, blocked storage) — never let
// that break the login page.
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the choice just isn't remembered */
  }
}

const REMEMBER_ME_KEY = "gamingVerseRememberMe";
// Set while a Google sign-in redirect is under way (the page reloads),
// with the page to return to afterwards.
const GOOGLE_REDIRECT_KEY = "gamingVerseGoogleRedirect";

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
const REMEMBERED_EMAIL_KEY = "gamingVerseEmail";

// Reserve a handle; if someone grabbed it in the last few seconds,
// fall back to handle + 3 digits rather than failing the signup.
async function claimHandleWithFallback(value, uid) {
  let handle = normalizeUsername(value);
  if (!(await claimUsername(handle, uid))) {
    handle = `${handle.slice(0, 16)}${Math.floor(100 + Math.random() * 900)}`;
    if (!(await claimUsername(handle, uid))) {
      throw new Error("Could not reserve a username.");
    }
  }
  return handle;
}

function Login({ user = null, authLoading = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  // The page a signed-out visitor was sent here from (ProtectedRoute).
  const returnTo = returnPathFrom(location.state?.from);

  // Seed from the remembered address on the first render so the field does
  // not flash empty before the effect runs.
  const [email, setEmail] = useState(
    () => readStorage(REMEMBERED_EMAIL_KEY) || "",
  );
  const [password, setPassword] = useState("");
  // Ticked unless the user un-ticked it before: an unticked box keeps the
  // session in this tab only, so new tabs and reopened browsers log out.
  const [rememberMe, setRememberMe] = useState(
    () => readStorage(REMEMBER_ME_KEY) !== "0",
  );
  const changeRememberMe = (checked) => {
    setRememberMe(checked);
    writeStorage(REMEMBER_ME_KEY, checked ? "1" : "0");
  };
  const [showPassword, setShowPassword] = useState(false);

  const [modal, setModal] = useState(null);
  useEscapeKey(() => setModal(null), Boolean(modal));

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupDob, setSignupDob] = useState("");

  const [ownerSignupName, setOwnerSignupName] = useState("");
  const [ownerSignupUsername, setOwnerSignupUsername] = useState("");
  const [ownerSignupEmail, setOwnerSignupEmail] = useState("");
  const [ownerSignupPhone, setOwnerSignupPhone] = useState("");
  const [ownerSignupPassword, setOwnerSignupPassword] = useState("");
  const [ownerSignupConfirmPassword, setOwnerSignupConfirmPassword] =
    useState("");
  const [ownerSignupRole, setOwnerSignupRole] = useState("cafe_owner");
  const [ownerSignupBusinessName, setOwnerSignupBusinessName] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // True while this page is signing someone in / up: it then navigates
  // itself, so the "already signed in" redirect below stays out of it.
  // Also true while returning from a Google sign-in redirect, until its
  // result is handled below.
  const [authBusy, setAuthBusy] = useState(
    () => readSession(GOOGLE_REDIRECT_KEY) !== null,
  );
  // Instagram / Facebook / WhatsApp / Line / Android WebView: Google
  // sign-in is blocked there, so suggest a real browser.
  const [inAppBrowser] = useState(() =>
    isInAppBrowser(typeof navigator === "undefined" ? "" : navigator.userAgent),
  );
  const [linkCopied, setLinkCopied] = useState(false);
  const [notice, setNotice] = useState(() =>
    hasBannedNotice() ? { text: BANNED_MESSAGE, type: "error" } : null,
  );

  const notify = (text, type = "info") => {
    if (!text) return;
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

  // Already signed in (App has finished its ban check): /login isn't
  // for you — go back where you were headed, or to your role's home.
  const signedInUid = !authLoading && !authBusy ? user?.uid || "" : "";
  useEffect(() => {
    if (!signedInUid) return undefined;
    let cancelled = false;
    readProfile(signedInUid).then((profile) => {
      if (!cancelled) navigate(returnTo || homePathFor(profile), { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [signedInUid, returnTo, navigate]);

  // After a successful sign-in: show the toast, then go to the page
  // the user was heading to, or their role's home page.
  const finishSignIn = async (uid, message, backTo = returnTo) => {
    const path = backTo || homePathFor(await readProfile(uid));
    notify(message, "success");
    window.setTimeout(() => navigate(path, { replace: true }), 600);
  };

  // Signed out right after signing in because the account is banned.
  const rejectIfBanned = async (uid) => {
    if (!(await isUserBanned(uid))) return false;
    await signOut(auth);
    consumeBannedNotice(); // App may have flagged it too
    notify(BANNED_MESSAGE, "error");
    return true;
  };

  // Back from a Google sign-in redirect: same ban check and landing page
  // as the pop-up. Only runs when this page started a redirect.
  const handleRedirectResult = useEffectEvent((pending, isCancelled) =>
    getRedirectResult(auth)
      .then(async (cred) => {
        if (isCancelled()) return;
        if (!cred?.user) {
          setAuthBusy(false);
          return;
        }
        if (await rejectIfBanned(cred.user.uid)) {
          setAuthBusy(false);
          return;
        }
        await finishSignIn(cred.user.uid, "Google login successful!", pending);
      })
      .catch((error) => {
        console.error("Google redirect sign-in error:", error);
        if (isCancelled()) return;
        setAuthBusy(false);
        notify(
          consumeBannedNotice()
            ? BANNED_MESSAGE
            : authErrorMessage(error.code, "google"),
          "error",
        );
      }),
  );
  useEffect(() => {
    const pending = readSession(GOOGLE_REDIRECT_KEY);
    if (pending === null) return undefined;
    writeSession(GOOGLE_REDIRECT_KEY, null);
    let cancelled = false;
    handleRedirectResult(pending, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      notify(`Copy this link: ${window.location.href}`, "info");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const identifier = email.trim();
    if (!identifier || !password) {
      notify("Please enter your email or username and password.", "error");
      return;
    }

    setLoading(true);
    setAuthBusy(true);
    let signedIn = false;

    try {
      // "Remember me" keeps the session after the browser closes;
      // otherwise it ends with the browser session.
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );

      let cred;
      if (isEmailIdentifier(identifier)) {
        cred = await signInWithEmailAndPassword(auth, identifier, password);
      } else {
        const handle = normalizeUsername(identifier);
        if (!isValidUsername(handle)) throw authError("auth/invalid-credential");
        const token = await usernameSignInToken(handle, password);
        cred = await signInWithCustomToken(auth, token);
      }

      if (await rejectIfBanned(cred.user.uid)) return;

      writeStorage(REMEMBERED_EMAIL_KEY, rememberMe ? identifier : null);

      signedIn = true;
      await finishSignIn(cred.user.uid, "Login successful!");
    } catch (error) {
      console.error(error);

      if (consumeBannedNotice()) {
        notify(BANNED_MESSAGE, "error");
      } else {
        notify(authErrorMessage(error.code, "login"), "error");
      }
    } finally {
      setLoading(false);
      if (!signedIn) setAuthBusy(false);
    }
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

    if (!isValidUsername(signupUsername)) {
      notify(`Username must be ${USERNAME_RULE_TEXT}`, "error");
      return;
    }

    try {
      if (!(await isUsernameAvailable(signupUsername))) {
        notify("This username is already taken. Please choose another.", "error");
        return;
      }
    } catch (error) {
      console.error("Username check failed:", error);
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

    const signupAge = calculateAgeFromDob(signupDob);

    if (signupAge === null || signupAge < 0 || signupAge > 120) {
      notify("Please enter a valid date of birth.", "error");
      return;
    }

    setLoading(true);
    setAuthBusy(true);
    let created = false;

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword,
      );

      await updateProfile(result.user, {
        displayName: signupName.trim(),
      });

      const handle = await claimHandleWithFallback(
        signupUsername,
        result.user.uid,
      );

      try {
        // DOB lets GamingVerse enforce age-based game access.
        await set(ref(db, `users/${result.user.uid}`), {
          firstName: signupName.trim().split(" ")[0] || signupName.trim(),
          lastName: signupName.trim().split(" ").slice(1).join(" "),
          username: handle,
          email: signupEmail.trim(),
          phone: normalizePhone(signupPhone),
          dob: signupDob,
          age: signupAge,
          createdAt: Date.now(),
        });
      } catch (profileError) {
        // Don't leave the handle reserved by a profile that wasn't saved.
        await releaseUsername(handle, result.user.uid).catch(() => {});
        throw profileError;
      }

      setSignupName("");
      setSignupUsername("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupPhone("");
      setSignupDob("");
      setModal(null);

      created = true;
      notify("Account created successfully!", "success");
      window.setTimeout(
        () => navigate(returnTo || "/games", { replace: true }),
        600,
      );
    } catch (error) {
      console.error(error);
      notify(authErrorMessage(error.code, "signup"), "error");
    } finally {
      setLoading(false);
      if (!created) setAuthBusy(false);
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

    if (!isValidUsername(ownerSignupUsername)) {
      notify(`Username must be ${USERNAME_RULE_TEXT}`, "error");
      return;
    }

    try {
      if (!(await isUsernameAvailable(ownerSignupUsername))) {
        notify("This username is already taken. Please choose another.", "error");
        return;
      }
    } catch (error) {
      console.error("Username check failed:", error);
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
    setAuthBusy(true);
    let created = false;

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        ownerSignupEmail.trim(),
        ownerSignupPassword,
      );

      await updateProfile(result.user, {
        displayName: ownerSignupName.trim(),
      });

      const handle = await claimHandleWithFallback(
        ownerSignupUsername,
        result.user.uid,
      );

      try {
        await set(ref(db, `users/${result.user.uid}`), {
          firstName:
            ownerSignupName.trim().split(" ")[0] || ownerSignupName.trim(),
          lastName: ownerSignupName.trim().split(" ").slice(1).join(" "),
          username: handle,
          email: ownerSignupEmail.trim(),
          phone: normalizePhone(ownerSignupPhone),
          // Business roles need admin approval (database rules enforce it).
          requestedRole: ownerSignupRole,
          businessName:
            ownerSignupRole === "shop_owner"
              ? ownerSignupBusinessName.trim()
              : "",
          createdAt: Date.now(),
        });
      } catch (profileError) {
        // Don't leave the handle reserved by a profile that wasn't saved.
        await releaseUsername(handle, result.user.uid).catch(() => {});
        throw profileError;
      }

      setOwnerSignupName("");
      setOwnerSignupUsername("");
      setOwnerSignupEmail("");
      setOwnerSignupPhone("");
      setOwnerSignupPassword("");
      setOwnerSignupConfirmPassword("");
      setOwnerSignupBusinessName("");
      setModal(null);

      created = true;
      notifyAdmins(
        `New business account waiting for approval: ${handle} (${
          ownerSignupRole === "cafe_owner" ? "café owner" : "shop owner"
        }).`,
        NOTIFY_TITLES.admin,
      ).catch((error) => console.warn("Admin notification failed:", error));
      notify(
        "Business account created! An admin will review and approve it shortly.",
        "success",
      );
      window.setTimeout(
        () => navigate("/owner-dashboard", { replace: true }),
        600,
      );
    } catch (error) {
      console.error(error);
      notify(authErrorMessage(error.code, "signup"), "error");
    } finally {
      setLoading(false);
      if (!created) setAuthBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      notify("Enter your email address.", "error");
      return;
    }

    setLoading(true);

    const sent = () => {
      notify(
        "If an account uses that email, a reset link is on its way — check your inbox.",
        "success",
      );
      setResetEmail("");
      setModal(null);
    };

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      sent();
    } catch (error) {
      console.error(error);
      // Same answer whether or not the email is registered.
      if (error.code === "auth/user-not-found") {
        sent();
      } else {
        notify(authErrorMessage(error.code, "reset"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthBusy(true);
    let signedIn = false;

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );

      const provider = new GoogleAuthProvider();
      let cred;
      try {
        cred = await signInWithPopup(auth, provider);
      } catch (popupError) {
        // Pop-ups blocked or unsupported here: sign in with a full-page
        // redirect instead. The result is handled when the page reloads.
        if (!POPUP_UNSUPPORTED_CODES.has(popupError.code)) throw popupError;
        writeSession(GOOGLE_REDIRECT_KEY, returnTo);
        signedIn = true; // keep the page busy while the browser leaves
        await signInWithRedirect(auth, provider);
        return;
      }

      if (await rejectIfBanned(cred.user.uid)) return;

      // New Google accounts finish their profile (username, phone,
      // date of birth) in ProfileGate right after this.
      signedIn = true;
      await finishSignIn(cred.user.uid, "Google login successful!");
    } catch (error) {
      console.error(error);

      writeSession(GOOGLE_REDIRECT_KEY, null);
      signedIn = false;
      if (consumeBannedNotice()) {
        notify(BANNED_MESSAGE, "error");
      } else {
        notify(authErrorMessage(error.code, "google"), "error");
      }
    } finally {
      setLoading(false);
      if (!signedIn) setAuthBusy(false);
    }
  };

  // Signed in already (and not in the middle of signing in here): the
  // redirect effect above is on its way — don't flash the login form.
  if (authLoading || signedInUid) return <PageLoading />;

  return (
    <div className="login-page">
      {notice && (
        <div
          className={`login-toast ${notice.type}`}
          role="status"
          title="Tap to dismiss"
          onClick={() => setNotice(null)}
        >
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
            <label htmlFor="login-identifier">Email or Username</label>

            <div className="input-wrapper">
              <span className="input-icon">👤</span>

              <input
                id="login-identifier"
                type="text"
                placeholder="Email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>

            <div className="input-wrapper">
              <span className="input-icon">🔒</span>

              <input
                id="login-password"
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
                onChange={(e) => changeRememberMe(e.target.checked)}
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

        {inAppBrowser && (
          <div className="in-app-browser-note" role="note">
            <p>
              <strong>For Google sign-in, open this page in Chrome or Safari.</strong>{" "}
              Google blocks sign-in inside apps like Instagram and WhatsApp.
            </p>
            <button type="button" onClick={copyPageLink}>
              {linkCopied ? "Link copied ✓" : "Copy link"}
            </button>
          </div>
        )}

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
          <span aria-hidden="true">💼</span>
          Create Business Account
        </button>

        <p className="login-support">
          Trouble signing in? <SupportLink>Help &amp; Support</SupportLink>
        </p>
      </div>

      {/* Create account modal */}
      {modal === "create" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
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
                aria-label="Your name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                autoComplete="name"
                required
              />

              <input
                type="text"
                placeholder="Username (e.g. ram_gamer)"
                aria-label="Username"
                value={signupUsername}
                onChange={(e) =>
                  setSignupUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""),
                  )
                }
                autoComplete="username"
                maxLength={20}
                title={USERNAME_RULE_TEXT}
                required
              />

              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <input
                type="tel"
                inputMode="numeric"
                placeholder="Mobile number (10 digits)"
                aria-label="Mobile number"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                autoComplete="tel-national"
                maxLength={14}
                required
              />

              <input
                type="password"
                placeholder="Password"
                aria-label="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <input
                type="password"
                placeholder="Confirm password"
                aria-label="Confirm password"
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
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-icon" aria-hidden="true">💼</div>

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
                  🎧 Accessories Shop
                </button>
              </div>

              <input
                type="text"
                placeholder="Your Name"
                aria-label="Your name"
                value={ownerSignupName}
                onChange={(e) => setOwnerSignupName(e.target.value)}
                autoComplete="name"
                required
              />

              <input
                type="text"
                placeholder="Username (e.g. pixel_cafe)"
                aria-label="Username"
                value={ownerSignupUsername}
                onChange={(e) =>
                  setOwnerSignupUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""),
                  )
                }
                autoComplete="username"
                maxLength={20}
                title={USERNAME_RULE_TEXT}
                required
              />

              <input
                type="email"
                placeholder="Business email address"
                aria-label="Business email address"
                value={ownerSignupEmail}
                onChange={(e) => setOwnerSignupEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <input
                type="tel"
                inputMode="numeric"
                placeholder="Mobile number (10 digits)"
                aria-label="Mobile number"
                value={ownerSignupPhone}
                onChange={(e) => setOwnerSignupPhone(e.target.value)}
                autoComplete="tel-national"
                maxLength={14}
                required
              />

              <input
                type="password"
                placeholder="Password"
                aria-label="Password"
                value={ownerSignupPassword}
                onChange={(e) => setOwnerSignupPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <input
                type="password"
                placeholder="Confirm password"
                aria-label="Confirm password"
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
                  aria-label="Shop or business name"
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
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
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
                aria-label="Email address"
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
