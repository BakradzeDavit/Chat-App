import React, { useEffect } from "react";
import { useState } from "react";
function Notifications({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && user.Notifications) {
      setNotifications(user.Notifications);
    }
  }, [user]);
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
          <div key={index} className="notification-item">
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
