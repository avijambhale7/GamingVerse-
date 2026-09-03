import React, { useState } from "react";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      console.log("Searching for:", search);
    }
  };

  return (
    <header className="gv-navbar">
      {/* LEFT SIDE */}
      <div className="gv-left">
        {/* Mobile Menu */}
        <button
          className="gv-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* LOGO */}
        <a href="/" className="gv-logo">
          <div className="gv-logo-icon">🎮</div>

          <div className="gv-logo-text">
            <div className="gv-logo-name">
              Gaming<span>Verse</span>
            </div>

            <div className="gv-tagline">LEVEL UP YOUR GAMING EXPERIENCE</div>
          </div>
        </a>
      </div>

      {/* NAVIGATION */}
      <nav className={`gv-nav ${menuOpen ? "active" : ""}`}>
        <a href="/" className="gv-nav-link active">
          <span className="gv-nav-icon">⌂</span>
          <span>Home</span>
        </a>

        <a href="/games" className="gv-nav-link">
          <span className="gv-nav-icon">🎮</span>
          <span>Games</span>
        </a>

        <a href="/community" className="gv-nav-link">
          <span className="gv-nav-icon">👥</span>
          <span>Community</span>
        </a>
      </nav>

      {/* RIGHT SIDE */}
      <div className="gv-right">
        {/* SEARCH */}
        <form className="gv-search" onSubmit={handleSearch}>
          <span className="gv-search-icon">🔍</span>

          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* NOTIFICATION */}
        <button
          className="gv-notification"
          onClick={() => alert("Notifications coming soon!")}
        >
          🔔
          <span className="gv-notification-dot"></span>
        </button>

        {/* PROFILE */}
        <button className="gv-profile" onClick={() => alert("Profile")}>
          <div className="gv-avatar">👾</div>

          <span className="gv-online"></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
