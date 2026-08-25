import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./FriendsPage.css";
import { handleAcceptRequest, handleRejectRequest } from "../functions/Friends";
import { createOrGetChat } from "../functions/Chat";

function FriendsPage({ user, socket }) {
  const [users, setUsers] = useState([]);
  const [FriendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("myfriends"); // 'myfriends', 'online', 'all', 'requests'

  const navigate = useNavigate();
  console.log(user);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Populate friend requests when users are loaded
  useEffect(() => {
    if (user?.friendRequestsReceived && users.length > 0) {
      const requests = user.friendRequestsReceived
        .map((requestId) => users.find((u) => u._id === requestId))
        .filter((req) => req !== undefined);
      setFriendRequests(requests);
    }
  }, [user?.friendRequestsReceived, users]);

  // Socket listener for real-time friend updates
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleFriendAdded = (data) => {
      console.log("Friend added:", data);
      fetchUsers();
    };

    const handleFriendRemoved = (data) => {
      console.log("Friend removed:", data);
      fetchUsers();
    };

    const updateUserStatus = (friendId, Status) => {
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          String(currentUser._id) === String(friendId)
            ? { ...currentUser, Status }
            : currentUser,
        ),
      );
    };

    const handleFriendOnline = ({ friendId }) => {
      updateUserStatus(friendId, "online");
    };

    const handleFriendOffline = ({ friendId }) => {
      updateUserStatus(friendId, "offline");
    };

    socket.on("friendAdded", handleFriendAdded);
    socket.on("friendRemoved", handleFriendRemoved);
    socket.on("friendOnline", handleFriendOnline);
    socket.on("friendOffline", handleFriendOffline);

    return () => {
      socket.off("friendAdded", handleFriendAdded);
      socket.off("friendRemoved", handleFriendRemoved);
      socket.off("friendOnline", handleFriendOnline);
      socket.off("friendOffline", handleFriendOffline);
    };
  }, [socket, user?.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const friends = data.filter((u) => u._id !== user._id);
        setUsers(friends);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (userId) => {
    try {
      const result = await createOrGetChat(userId);
      if (result.success) {
        const friend = users.find((u) => u._id === userId);
        navigate("/chats", {
          state: { selectedFriend: friend, chat: result.chat },
        });
      } else {
        alert("Failed to create or get chat");
      }
    } catch (error) {
      console.error("Error creating/getting chat:", error);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/users/${userId}/profile`);
  };

  const handleAcceptFriendRequest = async (id) => {
    const result = await handleAcceptRequest(id);
    if (result.success) {
      setFriendRequests((prev) => prev.filter((req) => req._id !== id));
      // Optionally refresh users to show new friend in list immediately if needed
      fetchUsers();
    }
  };

  const handleRejectFriendRequest = async (id) => {
    const result = await handleRejectRequest(id);
    if (result.success) {
      setFriendRequests((prev) => prev.filter((req) => req._id !== id));
    }
  };

  const getFilteredUsers = () => {
    if (!user || !user.friends) return [];

    if (activeTab === "myfriends") {
      return users.filter((u) => user.friends.includes(u._id));
    } else if (activeTab === "online") {
      return users.filter(
        (u) => user.friends.includes(u._id) && u.Status === "online",
      );
    } else if (activeTab === "all") {
      // Return users who are NOT friends (to find new people)
      return users.filter((u) => !user.friends.includes(u._id));
    } else if (activeTab === "requests") {
      return [];
    }
    return users;
  };

  const filteredUsers = getFilteredUsers();

  if (loading) {
    return (
      <div className="friends-page">
        <div className="friends-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="friends-container">
        <div className="friends-header">
          <h1>Friends</h1>
          <p>Connect with people around you</p>
        </div>

        <div className="friends-tabs">
          <button
            className={`friends-tab-btn ${activeTab === "myfriends" ? "active" : ""}`}
            onClick={() => setActiveTab("myfriends")}
          >
            <i className="bi bi-people-fill"></i>
            <span>My Friends</span>
          </button>
          <button
            className={`friends-tab-btn ${activeTab === "online" ? "active" : ""}`}
            onClick={() => setActiveTab("online")}
          >
            <i className="bi bi-person-check"></i>
            <span>Online</span>
          </button>
          <button
            className={`friends-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <i className="bi bi-search"></i>
            <span>Find People</span>
          </button>
          <button
            className={`friends-tab-btn ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            <i className="bi bi-person-plus"></i>
            <span>Requests</span>
          </button>
        </div>

        {activeTab === "requests" ? (
          <div className="friend-requests-section">
            <div className="empty-state">
              {FriendRequests?.length > 0 ? (
                FriendRequests.map((request) => (
                  <div key={request} className="friend-request">
                    {request.profileImage &&
                    request.profileImage !== "letter" ? (
                      <img
                        className="friend-avatar"
                        src={request.profileImage}
                        alt={`${request.displayName || "User"} avatar`}
                        onClick={() => handleViewProfile(request._id)}
                      />
                    ) : (
                      <div
                        className="friend-avatar friend-avatar-placeholder"
                        onClick={() => handleViewProfile(request._id)}
                      >
                        <span>
                          {request.displayName?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <div className="friend-request-info">
                      <h3
                        className="friend-name"
                        onClick={() => handleViewProfile(request._id)}
                      >
                        {request.displayName || "Unknown User"}
                      </h3>
                      <p className="friend-status">
                        <i
                          className={`bi bi-circle-fill ${request.Status === "online" ? "status-online" : "status-offline"}`}
                        ></i>
                        {request.Status === "online" ? "Online" : "Offline"}
                      </p>
                    </div>
                    <div className="friend-request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptFriendRequest(request._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectFriendRequest(request._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <div className="empty-icon">📭</div>
                  <p>No friend requests</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="friends-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((friendUser) => (
                <div key={friendUser._id} className="friend-card">
                  {friendUser.profileImage &&
                  friendUser.profileImage !== "letter" ? (
                    <img
                      className="friend-avatar"
                      src={friendUser.profileImage}
                      alt={`${friendUser.displayName || "User"} avatar`}
                      onClick={() => handleViewProfile(friendUser._id)}
                    />
                  ) : (
                    <div
                      className="friend-avatar friend-avatar-placeholder"
                      onClick={() => handleViewProfile(friendUser._id)}
                    >
                      <span>
                        {friendUser.displayName?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}

                  <div className="friend-card-info">
                    <h3
                      className="friend-name"
                      onClick={() => handleViewProfile(friendUser._id)}
                    >
                      {friendUser.displayName || "Unknown User"}
                    </h3>
                    <p className="friend-status">
                      <i
                        className={`bi bi-circle-fill ${friendUser.Status === "online" ? "status-online" : "status-offline"}`}
                      ></i>
                      {friendUser.Status === "online" ? "Online" : "Offline"}
                    </p>
                  </div>

                  <div className="friend-card-actions">
                    <button
                      className="friend-action-btn message-btn"
                      onClick={() => handleMessage(friendUser._id)}
                      title="Send Message"
                    >
                      <i className="bi bi-chat-dots"></i>
                      <span>Message</span>
                    </button>
                    <button
                      className="friend-action-btn profile-btn"
                      onClick={() => handleViewProfile(friendUser._id)}
                      title="View Profile"
                    >
                      <i className="bi bi-person"></i>
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
