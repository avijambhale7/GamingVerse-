/* =========================================================
   PHONE GATE
   Mobile number is compulsory. Email signup asks for it, but
   Google sign-in and older accounts may not have one — this
   blocks the app with a one-field form until it's saved.
   Admin accounts are exempt.
========================================================= */

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { auth, db } from "../firebase";
import { isValidPhone, normalizePhone } from "../utils/purchaseRequests.js";
import "./PhoneGate.css";

export default function PhoneGate({ user }) {
  const [profile, setProfile] = useState({ uid: "", data: null });
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    return onValue(
      ref(db, `users/${user.uid}`),
      (snap) => setProfile({ uid: user.uid, data: snap.val() || {} }),
      // Unreadable profile (offline etc.) — don't block the user.
      () => setProfile({ uid: user.uid, data: { role: "unknown", phone: "" } }),
    );
  }, [user]);

  const data = user && profile.uid === user.uid ? profile.data : null;
  if (!data) return null;
  if (data.role === "admin" || data.role === "unknown") return null;
  if (isValidPhone(data.phone)) return null;

  const save = async (event) => {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await set(ref(db, `users/${user.uid}/phone`), normalizePhone(phone));
    } catch (err) {
      console.error("Save phone error:", err);
      setError("Could not save your number. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="phone-gate" role="dialog" aria-modal="true">
      <form className="phone-gate-card" onSubmit={save}>
        <span className="phone-gate-icon" aria-hidden="true">
          📱
        </span>
        <h2>Add your mobile number</h2>
        <p>
          A mobile number is required on GamingVerse. It&apos;s only shared
          with a buyer or seller after both sides agree to a marketplace deal.
        </p>

        <div className="phone-gate-input">
          <span>+91</span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel-national"
            maxLength={14}
            autoFocus
            required
          />
        </div>

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
