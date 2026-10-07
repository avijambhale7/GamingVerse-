/* =========================================================
   PROFILE GATE ("complete your profile")
   Email sign-up asks for everything, but Google sign-in and
   older accounts can be missing pieces. Until they're saved,
   this blocks the app with a short form asking only for
   what's missing:
     • a mobile number (shared only after a marketplace deal)
     • a valid username that this account has claimed
       (usernames/{handle} = uid)
     • a date of birth (Games page age restrictions) — not
       asked of business accounts, which don't need it
   Admin accounts are exempt.
========================================================= */

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { get, onValue, ref, update } from "firebase/database";
import { auth, db } from "../firebase";
import { isValidPhone, normalizePhone } from "../utils/purchaseRequests.js";
import {
  USERNAME_RULE_TEXT,
  claimUsername,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
  releaseUsername,
} from "../utils/usernames.js";
import { isBusinessProfile } from "../utils/authFlow.js";
import { syncPublicProfile } from "../utils/publicProfile.js";
import { calculateAgeFromDob } from "../pages/games/utils/access.js";
import "./ProfileGate.css";

const sanitizeHandle = (value = "") =>
  normalizeUsername(value).replace(/[^a-z0-9_.]/g, "").slice(0, 20);

// A starting suggestion: their current username, display name or
// the part of their email before the @.
function suggestHandle(data, user) {
  const options = [
    data.username,
    user?.displayName?.replace(/\s+/g, "_"),
    user?.email?.split("@")[0],
  ];
  for (const option of options) {
    const handle = sanitizeHandle(option);
    if (handle.length >= 3) return handle;
  }
  return "";
}

const validAge = (dob) => {
  const age = calculateAgeFromDob(dob);
  return age !== null && age >= 0 && age <= 120 ? age : null;
};

export default function ProfileGate({ user }) {
  const [profile, setProfile] = useState({ uid: "", data: null });
  // usernames/{handle} → is it this account's? Keyed by "uid/handle".
  const [claim, setClaim] = useState({ key: "", owned: null });
  const [form, setForm] = useState({ uid: "", phone: "", username: "", dob: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    return onValue(
      ref(db, `users/${user.uid}`),
      (snap) => setProfile({ uid: user.uid, data: snap.val() || {} }),
      // Unreadable profile (offline etc.) — don't block the user.
      () => setProfile({ uid: user.uid, data: { role: "unknown" } }),
    );
  }, [user]);

  const data = user && profile.uid === user.uid ? profile.data : null;
  const currentHandle = data ? normalizeUsername(data.username || "") : "";
  const claimKey = user && isValidUsername(currentHandle) ? `${user.uid}/${currentHandle}` : "";

  // Only the owner can read usernames/{handle}, so a successful read
  // that returns this uid means the handle really is theirs.
  useEffect(() => {
    if (!claimKey) return undefined;
    let cancelled = false;
    const [uid, handle] = claimKey.split("/");
    get(ref(db, `usernames/${handle}`))
      .then((snap) => {
        if (!cancelled) setClaim({ key: claimKey, owned: snap.val() === uid });
      })
      .catch(() => {
        if (!cancelled) setClaim({ key: claimKey, owned: false });
      });
    return () => {
      cancelled = true;
    };
  }, [claimKey]);

  if (!data) return null;
  const role = String(data.role || "").toLowerCase();
  if (role === "admin" || role === "unknown") return null;

  // Still checking the username claim — wait rather than flash the form.
  const owned = claimKey ? (claim.key === claimKey ? claim.owned : null) : false;
  if (owned === null) return null;

  const needsPhone = !isValidPhone(data.phone);
  const needsUsername = !owned;
  const needsDob = !isBusinessProfile(data) && validAge(data.dob) === null;
  if (!needsPhone && !needsUsername && !needsDob) return null;

  // Form values start from what the profile already has.
  const values =
    form.uid === user.uid
      ? form
      : {
          uid: user.uid,
          phone: data.phone || "",
          username: suggestHandle(data, user),
          dob: data.dob || "",
        };
  const setField = (field, value) => setForm({ ...values, [field]: value });

  const save = async (event) => {
    event.preventDefault();
    setError("");

    const updates = {};
    if (needsPhone) {
      if (!isValidPhone(values.phone)) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      updates.phone = normalizePhone(values.phone);
    }
    if (needsDob) {
      const age = validAge(values.dob);
      if (age === null) {
        setError("Enter a valid date of birth.");
        return;
      }
      updates.dob = values.dob;
      updates.age = age;
    }
    const handle = needsUsername ? normalizeUsername(values.username) : "";
    if (needsUsername && !isValidUsername(handle)) {
      setError(`Username must be ${USERNAME_RULE_TEXT}`);
      return;
    }

    setSaving(true);
    let claimed = false;
    try {
      if (needsUsername) {
        if (!(await isUsernameAvailable(handle, user.uid))) {
          setError("That username is taken. Please choose another.");
          return;
        }
        if (!(await claimUsername(handle, user.uid))) {
          setError("That username was just taken. Please choose another.");
          return;
        }
        claimed = handle !== currentHandle;
        updates.username = handle;
      }
      await update(ref(db, `users/${user.uid}`), updates);
      syncPublicProfile(user.uid, { ...data, ...updates }, user);
    } catch (err) {
      console.error("Complete profile error:", err);
      // Don't leave a new handle reserved by a profile that wasn't saved.
      if (claimed) await releaseUsername(handle, user.uid);
      setError("Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const missing = [
    needsUsername && "a username",
    needsPhone && "your mobile number",
    needsDob && "your date of birth",
  ].filter(Boolean);
  const missingText =
    missing.length > 1
      ? `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`
      : missing[0];

  return (
    <div
      className="phone-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-gate-title"
    >
      <form className="phone-gate-card" onSubmit={save}>
        <span className="phone-gate-icon" aria-hidden="true">
          🎮
        </span>
        <h2 id="profile-gate-title">Complete your profile</h2>
        <p>Before you continue, add {missingText}.</p>

        {needsUsername && (
          <label className="profile-gate-field">
            <span>Username</span>
            <div className="phone-gate-input">
              <span>@</span>
              <input
                type="text"
                placeholder="ram_gamer"
                value={values.username}
                onChange={(e) => setField("username", sanitizeHandle(e.target.value))}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                title={USERNAME_RULE_TEXT}
                required
              />
            </div>
            <small>{USERNAME_RULE_TEXT}</small>
          </label>
        )}

        {needsPhone && (
          <label className="profile-gate-field">
            <span>Mobile number</span>
            <div className="phone-gate-input">
              <span>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                autoComplete="tel-national"
                maxLength={14}
                required
              />
            </div>
            <small>
              Only shared with a buyer or seller after both sides agree to a
              marketplace deal.
            </small>
          </label>
        )}

        {needsDob && (
          <label className="profile-gate-field">
            <span>Date of birth</span>
            <div className="phone-gate-input">
              <input
                className="profile-gate-date"
                type="date"
                value={values.dob}
                onChange={(e) => setField("dob", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <small>Used only to apply GamingVerse age restrictions.</small>
          </label>
        )}

        {error && <div className="phone-gate-error">{error}</div>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save & Continue"}
        </button>
        <button
          type="button"
          className="phone-gate-logout"
          onClick={() => signOut(auth)}
        >
          Log out instead
        </button>
      </form>
    </div>
  );
}
