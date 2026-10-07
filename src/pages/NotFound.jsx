/* =========================================================
   NOT FOUND (any unknown URL)
   A friendly dead end instead of a silent redirect, with a
   button back home ("/" sends signed-in users to Games and
   everyone else to Login).
========================================================= */

import { Link, useLocation } from "react-router-dom";
import GVLogoMark from "../components/GVLogoMark.jsx";
import "./NotFound.css";

export default function NotFound({ signedIn = false }) {
  const { pathname } = useLocation();

  return (
    <main className="not-found">
      <div className="not-found-glow" aria-hidden="true" />
      <section className="not-found-card">
        <span className="not-found-logo gv-logo-host" aria-hidden="true">
          <GVLogoMark />
        </span>
        <p className="not-found-code">404</p>
        <h1>Page not found</h1>
        <p className="not-found-text">
          There&apos;s nothing at <code>{pathname}</code>. The link may be
          broken, or the page may have moved.
        </p>
        <Link className="not-found-button" to="/" replace>
          {signedIn ? "← Back to GamingVerse" : "← Go to login"}
        </Link>
      </section>
    </main>
  );
}
