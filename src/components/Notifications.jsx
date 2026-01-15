import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
function Notifications({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.Notifications) {
      setNotifications(user.Notifications);
    }
  }, [user]);
  const handleNotificationClick = (notification) => {
    navigate(`/users/${notification.sender._id}/profile`);
    try {
      fetch(`${API_URL}/notifications/${notification._id}/read`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        catch(error) {
          console.error("Error marking notification as read:", error);
        },
      }).then((response) => {
        if (response.ok) {
          setNotifications((prevNotifications) =>
            prevNotifications.filter((n) => n._id !== notification._id)
          );
        } else {
          console.error("Failed to mark notification as read");
        }
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  return (
    <div>
      <i
        onClick={() => setIsOpen(!isOpen)}
        className={
          "Notifications " + (isOpen ? "bi bi-bell-fill" : "bi bi-bell")
        }
      ></i>
      <div className={`notifications-dropdown ${isOpen ? "open" : ""}`}>
        {notifications.map((notification, index) => (
          <div
            onClick={() =>
              navigate(`/users/${notification.sender._id}/profile`)
            }
            key={index}
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
        ))}
      </div>
    </div>
  );
}

export default Notifications;
