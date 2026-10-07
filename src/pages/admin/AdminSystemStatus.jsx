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

function rowsFrom(health) {
  return [
    {
      id: "serviceAccount",
      label: "Server key (username login, push notifications)",
      ok: health.serviceAccount,
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
      ok: health.rules === "up_to_date",
      fix: "Publish database.rules.json: push it to main (with the GitHub secret set) or paste it in Firebase console → Realtime Database → Rules.",
    },
    {
      id: "rawgConfigured",
      label: "RAWG games key",
      ok: health.rawgConfigured,
      fix: `Add RAWG_API_KEY in ${ENV_HINT}.`,
    },
    {
      id: "rawgReachable",
      label: "RAWG answers requests",
      ok: health.rawgReachable,
      fix: "Check the RAWG key and its monthly quota at rawg.io/apidocs.",
    },
    {
      id: "trailerKey",
      label: "Trailer (YouTube) key",
      ok: health.trailerKey,
      fix: `Add YOUTUBE_API_KEY in ${ENV_HINT}.`,
    },
    {
      id: "push",
      label: "Push notifications set up",
      ok: health.pushServer && health.pushClientKey,
      fix: `Needs FIREBASE_SERVICE_ACCOUNT and VITE_FIREBASE_VAPID_KEY in ${ENV_HINT}, then redeploy.`,
    },
  ];
}

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
    ok: !isPlaceholderEmail(SUPPORT_EMAIL),
    fix: "Set SUPPORT_EMAIL in src/config/support.js to your real address.",
  };
  const rows = [...state.rows, supportRow];
  const problems = rows.filter((row) => !row.ok).length;

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
          <span className={problems ? "is-warn" : "is-ok"}>
            {problems ? `${problems} to fix` : "All good ✓"}
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

      {state.error && <p className="admin-system-error">{state.error}</p>}

      <ul>
        {(state.loading ? [supportRow] : rows).map((row) => (
          <li key={row.id} className={row.ok ? "is-ok" : "is-warn"}>
            <span aria-hidden="true">{row.ok ? "✅" : "⚠️"}</span>
            <div>
              <strong>{row.label}</strong>
              {!row.ok && <small>{row.fix}</small>}
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
