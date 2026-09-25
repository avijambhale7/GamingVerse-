import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, db } from "./firebase";
import { BANNED_NOTICE_KEY } from "./utils/ban.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import PhoneGate from "./components/PhoneGate.jsx";

// Only Login is needed for the very first paint. Everything else loads
// on demand, so a fresh visit doesn't pay for the marketplace, café,
// owner dashboard and admin panel before it's even logged in.
import Login from "./pages/Login";
const Games = lazy(() => import("./pages/Games"));
const Cafe = lazy(() => import("./pages/Cafe"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));

import "./App.css";

const PAGE_LOADING_STYLE = {
  minHeight: "100vh",
  background: "#000",
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "20px",
};

function PageLoading() {
  return <div style={PAGE_LOADING_STYLE}>Loading GamingVerse...</div>;
}

/* =====================================================
   PROTECTED ROUTE
===================================================== */
function ProtectedRoute({ user, loading, children }) {
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

/* =====================================================
   APP
===================================================== */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopBanWatch = () => {};

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      stopBanWatch();
      stopBanWatch = () => {};

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Watch the ban flag live: a user banned at login time or while
      // already signed in is signed out immediately, and Login shows why.
      let firstCheck = true;
      stopBanWatch = onValue(
        ref(db, `users/${currentUser.uid}/isBanned`),
        (snap) => {
          if (snap.val() === true) {
            try {
              sessionStorage.setItem(BANNED_NOTICE_KEY, "1");
            } catch {
              /* storage unavailable — Login just won't show the reason */
            }
            setUser(null);
            setLoading(false);
            signOut(auth);
            return;
          }
          if (firstCheck) {
            firstCheck = false;
            setUser(currentUser);
            setLoading(false);
          }
        },
        () => {
          // Unreadable flag (e.g. offline) — don't lock the user out.
          setUser(currentUser);
          setLoading(false);
        },
      );
    });

    return () => {
      stopBanWatch();
      unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
      {user && <PhoneGate user={user} />}
      <BrowserRouter>
        <Routes>
          {/* =================================================
              HOME / ROOT
          ================================================= */}
          <Route
            path="/"
            element={<Navigate to={user ? "/games" : "/login"} replace />}
          />

          {/* =================================================
              LOGIN
          ================================================= */}
          <Route path="/login" element={<Login />} />

          {/* Legacy entry point. Owners sign in through /login like everyone
              else; the dashboard itself checks their role. */}
          <Route
            path="/owner-login"
            element={<Navigate to="/owner-dashboard" replace />}
          />

          {/* =================================================
              GAMINGVERSE / GAMES
          ================================================= */}
          <Route
            path="/games"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Games />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              GAMING CAFE BOOKING
          ================================================= */}
          <Route
            path="/cafe"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Cafe />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              CD MARKETPLACE
          ================================================= */}
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Marketplace />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              OWNER DASHBOARD
          ================================================= */}
          <Route
            path="/owner-dashboard"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              ADMIN PANEL
          ================================================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              PROFILE
          ================================================= */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              UNKNOWN URL
          ================================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
