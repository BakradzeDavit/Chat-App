import React from "react";
import { useState, useEffect, useRef } from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PostsPage from "./pages/PostsPage";
import UserPage from "./pages/UserPage";
import FriendsPage from "./pages/FriendsPage";
import { API_URL } from "./config";
import { io } from "socket.io-client";
import Header from "./components/Header";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

function AppContent() {
  const [LoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ FIX 1: Use useRef to create socket only once
  const socketRef = useRef(null);

  // Initialize socket connection once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(API_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      // Make socket globally accessible
      window.socketRef = socketRef;

      socketRef.current.on("connect", () => {
        console.log("Socket connected:", socketRef.current.id);
        // Re-emit user online event if we have a user
        // We need to access the current user state, but inside this closure 'user' might be stale if not careful.
        // However, we can use the window.user (dirty) or we can just rely on the effect below to handle INITIAL connection.
        // But for RECONNECTION, we need this.
        // Since we can't easily access 'user' state here without adding it to dependency (which restarts socket),
        // we can check localStorage or use a ref for user ID.
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.id) {
              socketRef.current.emit("userOnline", parsed.id);
              console.log("Re-emitted userOnline for:", parsed.id);
            }
          } catch (e) {
            console.error("Error parsing stored user for socket reconnect:", e);
          }
        }
      });

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Check for existing login
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

  // ✅ FIX 2: Fetch user profile only once after initial login
  useEffect(() => {
    if (!user?.id) return;

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
        } else if (response.status === 404) {
          console.error("Profile endpoint not found");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
    // ✅ Only run when user.id changes (on login), not when user object changes
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Global socket listeners that persist across pages
  useEffect(() => {
    if (!socketRef.current || !user?.id) return;

    const socket = socketRef.current;

    // Join user's socket room
    socket.emit("userOnline", user.id);
    console.log("App: User joined socket room:", user.id);

    // Listen for friend removed event
    const handleFriendRemoved = (data) => {
      const { friendId } = data;
      console.log("App: Friend removed via socket:", friendId);

      // Update user state immediately
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        const updatedUser = {
          ...prevUser,
          friends: prevUser.friends.filter((id) => id !== friendId),
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      });
    };

    // Listen for friend added event
    const handleFriendAdded = (data) => {
      const { friendId } = data;
      console.log("App: Friend added via socket:", friendId);

      // Update user state immediately
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        // Only add if not already in friends list
        if (prevUser.friends.includes(friendId)) return prevUser;
        const updatedUser = {
          ...prevUser,
          friends: [...prevUser.friends, friendId],
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      });
    };

    // Listen for friend online event
    const handleFriendOnline = (data) => {
      const { friendId } = data;
      console.log("App: Friend online via socket:", friendId);
      // TODO: Update friend status in UI
    };

    // Listen for friend offline event
    const handleFriendOffline = (data) => {
      const { friendId } = data;
      console.log("App: Friend offline via socket:", friendId);
      // TODO: Update friend status in UI
    };

    // Register listeners
    socket.on("friendRemoved", handleFriendRemoved);
    socket.on("friendAdded", handleFriendAdded);
    socket.on("friendOnline", handleFriendOnline);
    socket.on("friendOffline", handleFriendOffline);
    console.log("App: Registered global friend event listeners");

    return () => {
      socket.off("friendRemoved", handleFriendRemoved);
      socket.off("friendAdded", handleFriendAdded);
      socket.off("friendOnline", handleFriendOnline);
      socket.off("friendOffline", handleFriendOffline);
      console.log("App: Cleaned up global socket listeners");
    };
  }, [user?.id]); // Only re-run if user.id changes

  const handleLogout = () => {
    // Explicitly tell server to mark as offline
    if (socketRef.current && user?.id) {
      socketRef.current.emit("userLogout", user.id);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);

    navigate("/login");
  };

  return (
    <div className="app">
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
          element={
            LoggedIn ? (
              <HomePage socket={socketRef.current} />
            ) : (
              <Navigate to="/login" />
            )
          }
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
              <PostsPage user={user} socket={socketRef.current} />
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
        <Route
          path="/friends"
          element={
            LoggedIn && user ? (
              <FriendsPage user={user} socket={socketRef.current} />
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
