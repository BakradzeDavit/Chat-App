import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../config";
import "./UserPage.css";
function UserPage({ currentUser }) {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [friendStatus, setFriendStatus] = useState("none"); // 'none', 'friends', 'sent', 'received'
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/users/${id}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        setUserData(data.user);

        // Determine friend status
        if (data.user.isFriend) {
          setFriendStatus("friends");
        } else if (data.user.hasSentRequest) {
          setFriendStatus("sent");
        } else if (data.user.hasReceivedRequest) {
          setFriendStatus("received");
        } else {
          setFriendStatus("none");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [id]);
  const handleFriendRequest = async () => {
    try {
      const response = await fetch(
        `${API_URL}/users/${id}/send-friend-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        alert("Friend request sent successfully!");
        setFriendStatus("sent");
      } else {
        try {
          const responseText = await response.text();
          try {
            const errorData = JSON.parse(responseText);
            alert(`Failed to send friend request: ${errorData.message}`);
          } catch (jsonParseError) {
            alert(
              `Failed to send friend request: Server returned non-JSON response (status ${response.status}): ${responseText}`,
            );
          }
        } catch (textError) {
          alert(
            `Failed to send friend request: Unable to read server response (status ${response.status})`,
          );
        }
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("An error occurred while sending the friend request.");
    }
  };
  const handleAcceptRequest = async () => {
    try {
      const response = await fetch(
        `${API_URL}/users/${id}/accept-friend-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        alert("Friend request accepted!");
        setFriendStatus("friends");
      } else {
        try {
          const responseText = await response.text();
          try {
            const errorData = JSON.parse(responseText);
            alert(`Failed to accept friend request: ${errorData.message}`);
          } catch (jsonParseError) {
            alert(
              `Failed to accept friend request: Server returned non-JSON response (status ${response.status}): ${responseText}`,
            );
          }
        } catch (textError) {
          alert(
            `Failed to accept friend request: Unable to read server response (status ${response.status})`,
          );
        }
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("An error occurred while accepting the friend request.");
    }
  };

  const handleDeclineRequest = async () => {
    try {
      const response = await fetch(
        `${API_URL}/users/${id}/cancel-friend-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        alert("Friend request canceled!");
        setFriendStatus("none");
      } else {
        try {
          const responseText = await response.text();
          try {
            const errorData = JSON.parse(responseText);
            alert(`Failed to cancel friend request: ${errorData.message}`);
          } catch (jsonParseError) {
            alert(
              `Failed to cancel friend request: Server returned non-JSON response (status ${response.status}): ${responseText}`,
            );
          }
        } catch (textError) {
          alert(
            `Failed to cancel friend request: Unable to read server response (status ${response.status})`,
          );
        }
      }
    } catch (error) {
      console.error("Error canceling friend request:", error);
      alert("An error occurred while canceling the friend request.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>User not found</div>;

  return (
    <div className="user-page-container">
      <div className="user-page-wrapper">
        {/* Cover Banner */}
        <div className="user-cover-banner"></div>

        {/* Profile Info Section */}
        <div className="user-profile-section">
          <div className="user-profile-top">
            {/* Avatar */}
            <div className="user-avatar-container">
              {userData.profileImage && userData.profileImage !== "letter" ? (
                <img
                  src={userData.profileImage}
                  alt="Profile"
                  className="user-avatar-large"
                />
              ) : (
                <div className="user-avatar-placeholder-large">
                  {userData.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="user-actions">
              <button className="user-action-btn">
                <i className="bi bi-three-dots"></i>
              </button>
              <button
                className="user-follow-btn"
                onClick={() => {
                  if (friendStatus === "none") {
                    handleFriendRequest();
                  } else if (friendStatus === "sent") {
                    handleDeclineRequest();
                  } else if (friendStatus === "received") {
                    handleAcceptRequest();
                  }
                }}
                disabled={friendStatus === "friends"}
              >
                {friendStatus === "friends"
                  ? "Friends"
                  : friendStatus === "sent"
                    ? "Cancel Request"
                    : friendStatus === "received"
                      ? "Accept Request"
                      : "Add Friend"}
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="user-info-details">
            <h1 className="user-display-name">{userData.displayName}</h1>

            {/* Stats */}
            <div className="user-stats-row">
              <div className="user-stat-item">
                <span className="stat-value">{userData.PostsCount}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="user-stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="user-stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="user-tabs">
          <button
            className={`user-tab ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <i className="bi bi-grid-3x3"></i>
            <span>Posts</span>
          </button>
          <button
            className={`user-tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <i className="bi bi-person"></i>
            <span>About</span>
          </button>
          <button
            className={`user-tab ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            <i className="bi bi-image"></i>
            <span>Media</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="user-tab-content">
          {activeTab === "posts" && (
            <div className="empty-tab-state">
              <i className="bi bi-inbox empty-icon"></i>
              <p>No posts yet</p>
            </div>
          )}
          {activeTab === "about" && (
            <div className="about-content">
              <div className="about-item">
                <i className="bi bi-envelope"></i>
                <span>{userData.email}</span>
              </div>
              <div className="about-item">
                <i className="bi bi-calendar"></i>
                <span>Joined recently</span>
              </div>
            </div>
          )}
          {activeTab === "media" && (
            <div className="empty-tab-state">
              <i className="bi bi-images empty-icon"></i>
              <p>No media yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPage;
