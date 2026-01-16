import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Notifications({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // Initialize notifications from user prop
  useEffect(() => {
    if (user && user.Notifications) {
      setNotifications(user.Notifications);
    }
  }, [user?.Notifications?.length]); // Only update when notification count changes

  // Socket listener for new notifications
  useEffect(() => {
    const socket = window.socketRef?.current;
    if (!socket || !user?.id) return;

    const handleNewNotification = async (data) => {
      console.log("New notification received:", data);
      
      // Fetch updated user data to get populated notification
      try {
        const response = await fetch(`${API_URL}/users/${user.id}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setNotifications(userData.user.Notifications);
        }
      } catch (error) {
        console.error("Error fetching updated notifications:", error);
      }
    };

    socket.on("newNotification", handleNewNotification);
    console.log("Notifications: Registered newNotification listener");

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [user?.id]);
  
  const handleNotificationClick = async (notification) => {
    // Remove from local state immediately (optimistic update)
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n._id !== notification._id)
    );
    
    // Navigate to profile immediately
    navigate(`/users/${notification.sender._id}/profile`);
    
    // Delete from backend in background
    try {
      const response = await fetch(`${API_URL}/notifications/${notification._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to delete notification from backend");
        // Optionally: re-add the notification if deletion failed
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Filter to only show unread notifications
  const unreadNotifications = notifications.filter((n) => !n.Read);

  return (
    <div>
      <i
        onClick={() => setIsOpen(!isOpen)}
        className={
          "Notifications " + (isOpen ? "bi bi-bell-fill" : "bi bi-bell")
        }
      ></i>
      {unreadNotifications.length > 0 && (
        <span className="notification-badge">{unreadNotifications.length}</span>
      )}
      <div className={`notifications-dropdown ${isOpen ? "open" : ""}`}>
        {unreadNotifications.length === 0 ? (
          <div className="notification-item">
            <p>No new notifications</p>
          </div>
        ) : (
          unreadNotifications.map((notification, index) => (
            <div
              onClick={() => handleNotificationClick(notification)}
              key={notification._id || index}
              className="notification-item"
            >
              {notification.sender && (
                <img
                  src={
                    notification.sender.profileImage !== "letter"
                      ? notification.sender.profileImage
                      : ""
                  }
                  alt="Profile"
                  className="notification-avatar"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
              )}
              {!notification.sender?.profileImage ||
              notification.sender.profileImage === "letter" ? (
                <span className="notification-avatar-placeholder">
                  {notification.sender?.displayName?.charAt(0).toUpperCase() ||
                    "U"}
                </span>
              ) : null}
              {notification.type === "friendRequest" ? (
                <p>
                  <strong>{notification.sender?.displayName || "Someone"}</strong>{" "}
                  sent you a friend request.
                </p>
              ) : (
                <p>
                  <strong>{notification.sender?.displayName || "Someone"}</strong>{" "}
                  liked your post.
                </p>
              )}
              <i
                className={`bi ${notification.type === "friendRequest" ? "bi-person-plus" : "bi-hand-thumbs-up"} notification-icon`}
              ></i>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
