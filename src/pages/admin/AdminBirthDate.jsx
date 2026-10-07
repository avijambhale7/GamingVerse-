/* =========================================================
   ADMIN — CORRECT A BIRTH DATE
   Users can't change their own date of birth once it's set
   (database rules), so support corrects it here: pick a date,
   confirm, and users/{uid}/dob + age are saved and the user
   is notified. Rendered per user row by ../Admin.jsx.
========================================================= */

import { useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../../firebase";
import { NOTIFY_TITLES, notifyUser } from "../../utils/notify.js";
import { checkBirthDate } from "../../utils/birthDate.js";

export default function AdminBirthDate({ user, name, onMessage }) {
  const [step, setStep] = useState("closed"); // closed | edit | confirm
  const [dob, setDob] = useState(user.dob || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setStep("closed");
    setError("");
  };

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => {
          setDob(user.dob || "");
          setStep("edit");
        }}
      >
        🎂 Edit birth date
      </button>
    );
  }

  const check = checkBirthDate(dob);

  const review = (event) => {
    event.preventDefault();
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (dob === user.dob) {
      setError("That's already their date of birth.");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const save = async () => {
    setSaving(true);
    try {
      await update(ref(db, `users/${user.uid}`), { dob, age: check.age });
      notifyUser(
        user.uid,
        "Your date of birth was updated by GamingVerse support.",
        NOTIFY_TITLES.support,
      );
      onMessage(`Birth date for ${name} updated to ${dob}.`);
      close();
    } catch (err) {
      console.error("Birth date update error:", err);
      setError("Couldn't save the new birth date. Please try again.");
      setStep("edit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-dob-editor" onSubmit={review}>
      {step === "edit" ? (
        <>
          <label>
            Birth date for {name}
            <input
              type="date"
              value={dob}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setDob(e.target.value);
                setError("");
              }}
              required
            />
          </label>
          <small>
            Current: {user.dob || "not set"}
            {check.ok ? ` · New age: ${check.age}` : ""}
          </small>
          <div className="admin-dob-actions">
            <button type="submit">Review change</button>
            <button type="button" onClick={close}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Change <strong>{name}</strong>&apos;s date of birth from{" "}
            <strong>{user.dob || "not set"}</strong> to <strong>{dob}</strong>{" "}
            (age {check.age})? They&apos;ll be notified.
          </p>
          <div className="admin-dob-actions">
            <button
              type="button"
              className="is-confirm"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Yes, update it"}
            </button>
            <button type="button" onClick={() => setStep("edit")} disabled={saving}>
              Back
            </button>
          </div>
        </>
      )}
      {error && <p className="admin-dob-error">{error}</p>}
    </form>
  );
}
