/* =========================================================
   PUSH TOGGLE
   "Push notifications: On / Off" switch shown inside the
   notification panels. Hidden when the browser can't do push
   (or the VAPID key isn't configured).
========================================================= */

import { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  disablePush,
  enablePush,
  isPushEnabled,
  isPushSupported,
  pushPermission,
} from "../utils/push.js";
import { needsHomeScreenForPush } from "../utils/inAppBrowser.js";
import "./PushToggle.css";

const IOS_HOME_SCREEN_HINT =
  "On iPhone, tap Share → Add to Home Screen, then open GamingVerse from your Home Screen to get notifications.";

const currentDevice = () =>
  typeof navigator === "undefined"
    ? {}
    : {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        standalone: navigator.standalone,
      };

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uid = auth.currentUser?.uid;
  // iPhone/iPad Safari only allows push for Home Screen apps.
  const [iosNeedsInstall] = useState(() => needsHomeScreenForPush(currentDevice()));

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await isPushSupported();
      const on = ok ? await isPushEnabled(uid) : false;
      if (alive) {
        setSupported(ok);
        setEnabled(on);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uid]);

  if (!uid) return null;
  if (!supported) {
    if (!iosNeedsInstall) return null;
    return (
      <div className="push-toggle">
        <p className="push-toggle-ios">
          <span aria-hidden="true">📲</span> {IOS_HOME_SCREEN_HINT}
        </p>
      </div>
    );
  }

  const blocked = pushPermission() === "denied";

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      if (enabled) {
        await disablePush(uid);
        setEnabled(false);
      } else {
        await enablePush(uid);
        setEnabled(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
      setError(err.message || "Could not change push notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-toggle">
      <div className="push-toggle-row">
        <span>
          <strong>📲 Push notifications</strong>
          <small>
            {blocked
              ? "Blocked in your browser settings"
              : enabled
                ? "On for this device"
                : "Get alerts even when GamingVerse is closed"}
          </small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          className={`push-switch${enabled ? " on" : ""}`}
          onClick={toggle}
          disabled={busy || (blocked && !enabled)}
          aria-label="Push notifications"
        >
          <i aria-hidden="true" />
        </button>
      </div>
      {error && <p className="push-toggle-error">{error}</p>}
    </div>
  );
}
