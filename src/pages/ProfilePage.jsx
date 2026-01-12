import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";
function ProfilePage({ handleLogout, user, setUser }) {
  const [username, setUsername] = useState(user?.displayName || "");
  const [changeusername, setChangeUsername] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [friendRequestsSent, setFriendRequestsSent] = useState([]);
  const [friendRequestsReceived, setFriendRequestsReceived] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const sentRes = await fetch(`${API_URL}/users/friendRequestsSent`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (sentRes.ok) {
          const sentData = await sentRes.json();
          setFriendRequestsSent(sentData.friendRequests);
        }

        const receivedRes = await fetch(
          `${API_URL}/users/friendRequestsReceived`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (receivedRes.ok) {
          const receivedData = await receivedRes.json();
          setFriendRequestsReceived(receivedData.friendRequests);
        }
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };
    fetchRequests();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleEditUsername = async () => {
    if (!changeusername) {
      setChangeUsername(true);
    } else {
      if (username && username !== user.displayName) {
        try {
          const response = await fetch(`${API_URL}/update-username`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ username }),
          });

          if (response.ok) {
            const updatedUser = await response.json();
            setUser(updatedUser.user);
            localStorage.setItem("user", JSON.stringify(updatedUser.user));
          } else {
            alert("❌ Failed to update username.");
          }
        } catch (error) {
          console.error("Error updating username:", error);
        }
      }
      setChangeUsername(false);
    }
  };

  const UploadProfilePicture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await fetch(`${API_URL}/upload-profile-pic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="profile-info">
          <div className="avatar-section">
            <div
              className={`profile-avatar-wrapper ${isHovering ? "hovering" : ""} ${uploading ? "uploading" : ""}`}
              onClick={UploadProfilePicture}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {user.profileImage !== "letter" ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
              )}

              {isHovering && !uploading && (
                <div className="gallery-icon">
                  <i className="bi bi-camera"></i>
                </div>
              )}

              {uploading && (
                <div className="upload-overlay">
                  <div className="spinner" />
                  <div className="upload-text">Uploading...</div>
                </div>
              )}
            </div>

            <div className="user-info">
              <h2>{user.displayName}</h2>
              <p>{user.email}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-section">
            <label>Username</label>
            <div className="rename-username">
              {changeusername ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="username-input"
                  placeholder="Enter new username"
                />
              ) : (
                <p className="username-display">{user.displayName}</p>
              )}
              <button onClick={handleEditUsername} className="edit-btn">
                <i
                  className={changeusername ? `bi bi-check-lg` : `bi bi-pencil`}
                ></i>
              </button>
            </div>
          </div>

          <div className="profile-section">
            <label>Email</label>
            <p className="email-display">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
