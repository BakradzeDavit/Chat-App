import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import Notifications from "./Notifications";
function Header({ user }) {
  return (
    <header className="header">
      <Link to="/" className="logo-link">
        <img src={logo} alt="App Logo" className="logo" />
      </Link>

      <nav className="nav">
        <Notifications user={user} />
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/Friends" className="nav-link">
          Friends
        </Link>
        <Link to="/Posts" className="nav-link">
          Posts
        </Link>
        <Link to="/Profile" className="nav-link">
          Profile
        </Link>
      </nav>
    </header>
  );
}

export default Header;
