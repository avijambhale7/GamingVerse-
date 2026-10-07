/* =========================================================
   ADMIN — SYSTEM STATUS
   Asks /api/health (admins only) whether the server keys and the
   live database rules are set up, and shows a ✅ / ⚠️ row per
   check with a one-line fix. Also measures, on demand, how much
   photo data (data URLs) is stored in posts, products and cafés.
   Rendered on the Overview by ../Admin.jsx.
========================================================= */

import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { auth, db } from "../../firebase";
import { SUPPORT_EMAIL, isPlaceholderEmail } from "../../config/support.js";
import {
  PHOTO_SIZE_WARNING_BYTES,
  dataUrlChars,
  formatBytes,
} from "../../utils/systemStatus.js";

const ENV_HINT = "Vercel → Settings → Environment Variables";

// Each row: state "ok" (✅), "warn" (⚠️ needs fixing) or "unknown" (ℹ️
// couldn't be checked yet — e.g. everything that needs the server key
// while that key is missing). Only "warn" counts as something to fix.
function stateOf(ok, known = true) {
  if (!known) return "unknown";
  return ok ? "ok" : "warn";
}

function rowsFrom(health) {
  // Without the server key nothing else on the server can be checked.
  const serverReady = health.serviceAccount === true;
  const rows = [
    {
      id: "serviceAccount",
      label: "Server key (username login, push notifications)",
      state: stateOf(serverReady),
      fix: `Add FIREBASE_SERVICE_ACCOUNT (the service-account JSON on one line) in ${ENV_HINT}, then redeploy.`,
    },
    {
      id: "rules",
      label:
        health.rules === "up_to_date"
          ? "Database rules up to date"
          : health.rules === "not_published"
            ? "Database rules NOT published"
            : "Database rules (couldn't check)",
      state: stateOf(health.rules === "up_to_date", serverReady && health.rules !== "unknown"),
      fix: "Publish database.rules.json: push it to main (with the GitHub secret set) or paste it in Firebase console → Realtime Database → Rules.",
    },
    {
      id: "rawgConfigured",
      label: "RAWG games key",
      state: stateOf(health.rawgConfigured, serverReady),
      fix: `Add RAWG_API_KEY in ${ENV_HINT}.`,
    },
    {
      id: "rawgReachable",
      label: "RAWG answers requests",
      state: stateOf(health.rawgReachable, serverReady && health.rawgConfigured),
      fix: "Check the RAWG key and its monthly quota at rawg.io/apidocs.",
    },
    {
      id: "trailerKey",
      label: "Trailer (YouTube) key",
      state: stateOf(health.trailerKey, serverReady),
      fix: `Add YOUTUBE_API_KEY in ${ENV_HINT}.`,
    },
    {
      id: "push",
      label: "Push notifications set up",
      state: stateOf(health.pushServer && health.pushClientKey, serverReady),
      fix: `Needs FIREBASE_SERVICE_ACCOUNT and VITE_FIREBASE_VAPID_KEY in ${ENV_HINT}, then redeploy.`,
    },
  ];
  return rows.map((row) =>
    row.state === "unknown"
      ? {
          ...row,
          fix: serverReady
            ? "Couldn't check this right now — press Re-check."
            : "Can't check this until the server key (above) is set.",
        }
      : row,
  );
}

// Local dev only sees .env.local, not the keys set on Vercel.
const IS_LOCAL =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

export default function AdminSystemStatus() {
  const [state, setState] = useState({ loading: true, rows: [], error: "" });
  const [reload, setReload] = useState(0);
  const [size, setSize] = useState({ checking: false, bytes: null, error: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch("/api/health", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const body = await response.json().catch(() => ({}));
        if (!alive) return;
        if (response.status === 503) {
          setState({ loading: false, rows: rowsFrom({ serviceAccount: false }), error: "" });
        } else if (!response.ok) {
          setState({
            loading: false,
            rows: [],
            error:
              response.status === 404
                ? "System status runs on the deployed site (it isn't available in npm run dev without the server key)."
                : body.error || "Couldn't check the system status.",
          });
        } else {
          setState({ loading: false, rows: rowsFrom(body), error: "" });
        }
      } catch {
        if (alive) {
          setState({ loading: false, rows: [], error: "Couldn't reach /api/health." });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [reload]);

  const supportRow = {
    id: "support",
    label: "Support email set",
    state: stateOf(!isPlaceholderEmail(SUPPORT_EMAIL)),
    fix: "Set SUPPORT_EMAIL in src/config/support.js to your real address.",
  };
  const rows = [...state.rows, supportRow];
  const problems = rows.filter((row) => row.state === "warn").length;
  const unknowns = rows.filter((row) => row.state === "unknown").length;

  // Downloads posts, products and cafés once — only when asked.
  const checkSize = async () => {
    setSize({ checking: true, bytes: null, error: "" });
    try {
      const snaps = await Promise.all(
        ["posts", "products", "cafes"].map((path) => get(ref(db, path))),
      );
      const bytes = snaps.reduce((sum, snap) => sum + dataUrlChars(snap.val()), 0);
      setSize({ checking: false, bytes, error: "" });
    } catch (error) {
      console.error("Photo size check error:", error);
      setSize({ checking: false, bytes: null, error: "Couldn't measure photo storage." });
    }
  };

  return (
    <section className="admin-system-status" aria-labelledby="system-status-title">
      <div className="admin-system-head">
        <h2 id="system-status-title">System status</h2>
        {!state.loading && (
          <span className={problems ? "is-warn" : unknowns ? "is-unknown" : "is-ok"}>
            {problems
              ? `${problems} to fix`
              : unknowns
                ? `${unknowns} not checked`
                : "All good ✓"}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setState((s) => ({ ...s, loading: true }));
            setReload((n) => n + 1);
          }}
          disabled={state.loading}
        >
          {state.loading ? "Checking…" : "↻ Re-check"}
        </button>
      </div>

      {IS_LOCAL && (
        <p className="admin-system-note">
          ℹ️ You&apos;re on localhost, so this checks the keys in{" "}
          <code>.env.local</code>, not the ones set on Vercel. Open Admin on
          the live site to check production.
        </p>
      )}
      {state.error && <p className="admin-system-error">{state.error}</p>}

      <ul>
        {(state.loading ? [supportRow] : rows).map((row) => (
          <li key={row.id} className={`is-${row.state}`}>
            <span aria-hidden="true">
              {row.state === "ok" ? "✅" : row.state === "warn" ? "⚠️" : "ℹ️"}
            </span>
            <div>
              <strong>{row.label}</strong>
              {row.state !== "ok" && <small>{row.fix}</small>}
            </div>
          </li>
        ))}
      </ul>

      <div className="admin-system-size">
        <div>
          <strong>Photo storage</strong>
          <small>
            {size.bytes === null
              ? "Size of photos stored in posts, products and cafés."
              : `≈ ${formatBytes(size.bytes)} of photos stored in the database.`}
          </small>
          {size.bytes !== null && size.bytes > PHOTO_SIZE_WARNING_BYTES && (
            <p className="admin-system-error">
              ⚠️ Over 500 MB — the Realtime Database may slow down or cost more.
              Remove old posts or listings with large photos.
            </p>
          )}
          {size.error && <p className="admin-system-error">{size.error}</p>}
        </div>
        <button type="button" onClick={checkSize} disabled={size.checking}>
          {size.checking ? "Measuring…" : "Check size"}
        </button>
      </div>
    </section>
  );
}
