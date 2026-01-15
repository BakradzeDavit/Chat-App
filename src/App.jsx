import React from "react";
import { useState, useEffect } from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PostsPage from "./pages/PostsPage";
import UserPage from "./pages/UserPage";
import FriendsPage from "./pages/FriendsPage";
import { API_URL } from "./config";

import Header from "./components/Header";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate, // ✅ Add this
} from "react-router-dom";

function AppContent() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // ✅ Add this

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser && storedUser !== "undefined") {
      try {
        setLoggedIn(true);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoggedIn(false);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchCurrentUser = async () => {
        try {
          const response = await fetch(`${API_URL}/users/${user.id}/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const updatedUser = { ...user, ...data.user };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      };
      fetchCurrentUser();
    }
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);
    navigate("/login"); // ✅ Use navigate instead
  };

  return (
    <div>
      {LoggedIn && <Header user={user} />}
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
        <Route
          path="/users/:id/profile"
          element={
            LoggedIn && user ? (
              <UserPage currentUser={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        4
        <Route
          path="/friends"
          element={
            LoggedIn && user ? (
              <FriendsPage user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
