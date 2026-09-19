import { Component } from "react";

/* =========================================================
   ERROR BOUNDARY
   A crash inside any one page used to blank the whole app.
   This catches render errors below it and shows a recoverable
   screen instead of a white page.
========================================================= */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("GamingVerse crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          background: "#000",
          color: "#fff",
          fontFamily:
            "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <span style={{ fontSize: "42px" }}>⚠️</span>
        <h1 style={{ margin: 0, fontSize: "22px" }}>
          Something went wrong.
        </h1>
        <p style={{ margin: 0, color: "#9a9aa4", maxWidth: "420px" }}>
          GamingVerse hit an unexpected error on this page. Reloading
          usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "8px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "0",
            background: "linear-gradient(135deg, #792cff, #a855f7)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reload GamingVerse
        </button>
      </div>
    );
  }
}
