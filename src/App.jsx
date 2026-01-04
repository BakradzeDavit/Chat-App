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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);
    navigate("/login"); // ✅ Use navigate instead
  };

  return (
    <div>
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
