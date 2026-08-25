import React from "react";
import { useState, useEffect, useRef } from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import PostsPage from "./pages/PostsPage";
import UserPage from "./pages/UserPage";
import ChatsPage from "./pages/ChatsPage";
import PostPage from "./pages/PostPage";
import { API_URL } from "./config";
import { io } from "socket.io-client";
import Header from "./components/Header";
import Alertcomp from "./components/alert";
import postfunctions from "./functions/posts";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Alert } from "bootstrap";

function AppContent() {
  const [alertMessage, setAlertMessage] = useState("");
  const [LoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser && storedUser !== "undefined"
      ? JSON.parse(storedUser)
      : null;
  });
  const [socketConnection, setSocketConnection] = useState(null);
  const navigate = useNavigate();

  // ✅ FIX 1: Use useRef to create socket only once
  const socketRef = useRef(null);

  // Keep the socket lifecycle aligned with the logged-in user.
  useEffect(() => {
    if (!LoggedIn || !user?.id) return;

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    window.socketRef = socketRef;
    setSocketConnection(socket);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setSocketConnection((current) => (current === socket ? null : current));
    };
  }, [LoggedIn, user?.id]);

  // Check for existing login
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          localStorage.removeItem("user");
          setLoggedIn(false);
          setUser(null);
          return;
        }

        const data = await response.json();

        setLoggedIn(true);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (error) {
        console.error("Failed to restore session:", error);
        setLoggedIn(false);
        setUser(null);
      }
    };

    restoreSession();
  }, []);

  // ✅ FIX 2: Fetch user profile only once after initial login
  useEffect(() => {
    if (!user?.id) return;

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_URL}/users/${user.id}/profile`, {
          credentials: "include",
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
    if (!socketConnection || !user?.id) return;

    const socket = socketConnection;

    const announceOnline = () => {
      socket.emit("userOnline");
      console.log("App: User joined socket room:", user.id);
    };

    socket.on("connect", announceOnline);
    if (socket.connected) announceOnline();

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

    // Listen for new notifications (including friend requests)
    const handleNewNotification = async (notification) => {
      console.log("App: New notification received:", notification);

      // If it's a friend request, refresh the user data
      if (notification.type === "friendRequest") {
        try {
          const response = await fetch(`${API_URL}/users/${user.id}/profile`, {
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setUser((prevUser) => {
              const updatedUser = { ...prevUser, ...data.user };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              return updatedUser;
            });
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }
    };

    // Register listeners
    socket.on("friendRemoved", handleFriendRemoved);
    socket.on("friendAdded", handleFriendAdded);
    socket.on("friendOnline", handleFriendOnline);
    socket.on("friendOffline", handleFriendOffline);
    socket.on("newNotification", handleNewNotification);
    console.log("App: Registered global friend event listeners");

    return () => {
      socket.off("connect", announceOnline);
      socket.off("friendRemoved", handleFriendRemoved);
      socket.off("friendAdded", handleFriendAdded);
      socket.off("friendOnline", handleFriendOnline);
      socket.off("friendOffline", handleFriendOffline);
      socket.off("newNotification", handleNewNotification);
      console.log("App: Cleaned up global socket listeners");
    };
  }, [socketConnection, user?.id]);
  const handleLogout = async () => {
    // Explicitly tell server to mark as offline
    if (socketRef.current && user?.id) {
      socketRef.current.emit("userLogout", user.id);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocketConnection(null);

    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);

    navigate("/login");
  };

  return (
    <div className="app">
      {LoggedIn && <Header user={user} />}
      {alertMessage && (
        <Alertcomp message={alertMessage} setAlertMessage={setAlertMessage} />
      )}
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
              <Login
                setLoggedIn={setLoggedIn}
                setUser={setUser}
                setAlertMessage={setAlertMessage}
              />
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
              <HomePage socket={socketConnection} />
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
                setAlertMessage={setAlertMessage}
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
              <PostsPage
                user={user}
                socket={socketConnection}
                setAlertMessage={setAlertMessage}
              />
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
          path="/chats"
          element={
            LoggedIn && user ? (
              <ChatsPage user={user} socket={socketConnection} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/posts/:postId"
          element={
            <PostPage
              user={user}
              socket={socketConnection}
              setAlertMessage={setAlertMessage}
            />
          }
        />

        <Route
          path="/friends"
          element={
            LoggedIn && user ? (
              <FriendsPage user={user} socket={socketConnection} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
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
