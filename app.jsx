import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./pages/Login";
import Games from "./pages/Games";
import Profile from "./pages/Profile";

import "./App.css";

/* =====================================================
   PROTECTED ROUTE
===================================================== */

function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px",
        }}
      >
        Loading GamingVerse...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =====================================================
   APP
===================================================== */

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
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
  );
}

export default App;
