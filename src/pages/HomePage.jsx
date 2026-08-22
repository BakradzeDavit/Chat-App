import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const displayName = user?.displayName || "friend";

  return (
    <main className="home-page">
      <section className="home-shell">
        <div className="home-intro">
          <p className="home-kicker">Your corner of Lomis</p>
          <h1>
            Welcome back,
            <span>{displayName}.</span>
          </h1>
          <p className="home-lead">
            A quieter place to catch up, share what is on your mind, and stay
            close to your people.
          </p>
          <div className="home-actions">
            <Link to="/chats" className="home-primary-link">
              Open messages
              <i className="bi bi-arrow-right"></i>
            </Link>
            <Link to="/posts" className="home-secondary-link">
              See recent posts
            </Link>
          </div>
        </div>

        <nav className="home-directory" aria-label="Quick links">
          <p>Start somewhere</p>
          <Link to="/friends">
            <span>01</span>
            <strong>Find your people</strong>
            <i className="bi bi-arrow-up-right"></i>
          </Link>
          <Link to="/posts">
            <span>02</span>
            <strong>Share an update</strong>
            <i className="bi bi-arrow-up-right"></i>
          </Link>
          <Link to="/profile">
            <span>03</span>
            <strong>Make it yours</strong>
            <i className="bi bi-arrow-up-right"></i>
          </Link>
        </nav>
      </section>
    </main>
  );
}

export default HomePage;
