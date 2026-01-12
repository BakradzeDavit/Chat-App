import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../config";
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
        console.log("Fetching user data for ID:", id);

        const response = await fetch(`${API_URL}/users/${id}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Fetched data:", data);
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
      console.log(
        "Sending friend request to:",
        `${API_URL}/users/${id}/send-friend-request`
      );
      const response = await fetch(
        `${API_URL}/users/${id}/send-friend-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        alert("Friend request sent successfully!");
        setFriendStatus("sent");
      } else {
        console.log("Response not ok, attempting to read response body...");
        try {
          const responseText = await response.text();
          console.log("Response text:", responseText);
          try {
            const errorData = JSON.parse(responseText);
            console.log("Parsed error data:", errorData);
            alert(`Failed to send friend request: ${errorData.message}`);
          } catch (jsonParseError) {
            console.error("Failed to parse response as JSON:", jsonParseError);
            alert(
              `Failed to send friend request: Server returned non-JSON response (status ${response.status}): ${responseText}`
            );
          }
        } catch (textError) {
          console.error("Failed to read response as text:", textError);
          alert(
            `Failed to send friend request: Unable to read server response (status ${response.status})`
          );
        }
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("An error occurred while sending the friend request.");
    }
  };
  const CheckFriendStatus = async () => {
    userData;
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
                onClick={friendStatus === "none" ? handleFriendRequest : null}
                disabled={friendStatus !== "none"}
              >
                {friendStatus === "friends"
                  ? "Friends"
                  : friendStatus === "sent"
                    ? "Request Sent"
                    : friendStatus === "received"
                      ? "Request Received"
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
