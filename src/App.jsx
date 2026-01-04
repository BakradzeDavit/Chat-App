import React from "react";
import { useState, useEffect } from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PostsPage from "./pages/PostsPage";
import Header from "./components/Header";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

function App() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);
    window.location.href = "/login"; // Force reload
  };

  return (
    <div>
      <Router>
        {LoggedIn && <Header />}
        <Routes>
          <Route
            path="/"
            element={
              LoggedIn ? <Navigate to="/home" /> : <Navigate to="/signup" />
            }
          />
          <Route
            path="/login"
            element={
              LoggedIn ? (
                <Navigate to="/home" />
              ) : (
                <Login setLoggedIn={setLoggedIn} setUser={setUser} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              LoggedIn ? (
                <Navigate to="/home" />
              ) : (
                <SignUp setLoggedIn={setLoggedIn} setUser={setUser} />
              )
            }
          />
          <Route
            path="/home"
            element={LoggedIn ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={
              LoggedIn && user ? (
                <ProfilePage
                  user={user}
                  setUser={setUser}
                  handleLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/posts"
            element={
              LoggedIn && user ? (
                <PostsPage user={user} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
