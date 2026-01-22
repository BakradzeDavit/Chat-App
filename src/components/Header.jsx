import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/Logo.png";
import Notifications from "./Notifications";
import "./Header.css";

function Header({ user }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo-link">
          <img src={logo} alt="App Logo" className="logo" />
        </Link>
      </div>

      <nav className="header-center">
        <Link
          to="/home"
          className={`nav-link ${isActive("/home") ? "active" : ""}`}
        >
          <i className="bi bi-house-door-fill"></i>
          <span>Home</span>
        </Link>
        <Link
          to="/friends"
          className={`nav-link ${isActive("/friends") ? "active" : ""}`}
        >
          <i className="bi bi-people-fill"></i>
          <span>Friends</span>
        </Link>
        <Link
          to="/posts"
          className={`nav-link ${isActive("/posts") ? "active" : ""}`}
        >
          <i className="bi bi-card-text"></i>
          <span>Posts</span>
        </Link>
      </nav>

      <div className="header-right">
        <div className="notification-wrapper">
          <Notifications user={user} />
        </div>

        <Link to="/profile" className="profile-link" title="Go to Profile">
          <div className="header-user-info">
            <span className="header-username">{user?.displayName}</span>
          </div>
          {user?.profileImage && user.profileImage !== "letter" ? (
            <img
              src={user.profileImage}
              alt={user.displayName}
              className="header-avatar"
            />
          ) : (
            <div className="header-avatar-placeholder">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

export default Header;
