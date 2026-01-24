import React from "react";
import { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";
import "./FriendsPage.css";

function FriendsPage({ user, socket }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const handleRemoveFriend = async (friendId) => {
    try {
      const response = await fetch(
        `${API_URL}/users/${friendId}/remove-friend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        setFriends(friends.filter((friend) => friend._id !== friendId));
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem("user"));
        currentUser.friends = currentUser.friends.filter(
          (id) => id !== friendId,
        );
        localStorage.setItem("user", JSON.stringify(currentUser));

        // Clear selected friend if it was removed
        if (selectedFriend?._id === friendId) {
          setSelectedFriend(null);
        }
      } else {
        alert("Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedFriend) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: "me",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setMessages([...messages, newMessage]);
      setMessage("");

      // TODO: Send message via socket
      // socket.emit('send_message', { to: selectedFriend._id, text: message });
    }
  };

  // Fetch friends list when user.friends changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        const friendsOnly = data.filter(
          (friend) => user.friends && user.friends.includes(friend._id),
        );

        setFriends(friendsOnly);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
  }, [user?.id, user?.friends?.length]);

  // ✅ Socket listener for online/offline status
  useEffect(() => {
    if (!socket) return;

    const handleFriendOnline = (data) => {
      const { friendId } = data;
      console.log("Friend online:", friendId);

      setFriends((prevFriends) =>
        prevFriends.map((f) =>
          f._id === friendId ? { ...f, Status: "online" } : f
        )
      );

      if (selectedFriend?._id === friendId) {
        setSelectedFriend((prev) => ({ ...prev, Status: "online" }));
      }
    };

    const handleFriendOffline = (data) => {
      const { friendId } = data;
      console.log("Friend offline:", friendId);

      setFriends((prevFriends) =>
        prevFriends.map((f) =>
          f._id === friendId ? { ...f, Status: "offline" } : f
        )
      );

      if (selectedFriend?._id === friendId) {
        setSelectedFriend((prev) => ({ ...prev, Status: "offline" }));
      }
    };

    socket.on("friendOnline", handleFriendOnline);
    socket.on("friendOffline", handleFriendOffline);

    return () => {
      socket.off("friendOnline", handleFriendOnline);
      socket.off("friendOffline", handleFriendOffline);
    };
  }, [socket, selectedFriend?._id]);

  return (
    <div className="friends-page">
      {/* Left Sidebar - Friends List */}
      <div className="friends-sidebar">
        <div className="sidebar-header">
          <h1>Messages</h1>
          <div className="search-bar">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search friends"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="friends-list">
          {friends
            .filter((friend) =>
              friend.displayName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
            )
            .map((friend) => (
              <div
                key={friend._id}
                className={`friend-item ${selectedFriend?._id === friend._id ? "active" : ""}`}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="friend-header">
                  <img
                    className="friend-image"
                    src={friend.profileImage}
                    alt=""
                  />
                  <div
                    className={`friend-status ${friend.Status === "online" ? "online" : "offline"}`}
                  ></div>
                </div>
                <div className="friend-info">
                  <div className="friend-name-row">
                    <span className="friend-name">{friend.displayName}</span>
                    <span className="friend-time">2m</span>
                  </div>
                  <p className="friend-last-message">
                    Click to start chatting...
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="chat-area">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  <img src={selectedFriend.profileImage} alt="" />
                  <div
                    className={`chat-header-status ${selectedFriend.Status === "online" ? "online" : "offline"}`}
                  ></div>
                </div>
                <div className="chat-header-text">
                  <h3>{selectedFriend.displayName}</h3>
                  <p>
                    {selectedFriend.Status === "online"
                      ? "Active now"
                      : "Offline"}
                  </p>
                </div>
              </div>

              <div className="chat-header-actions">
                <button className="chat-action-btn">
                  <i className="bi bi-telephone"></i>
                </button>
                <button className="chat-action-btn">
                  <i className="bi bi-camera-video"></i>
                </button>
                <button className="chat-action-btn">
                  <i className="bi bi-info-circle"></i>
                </button>
                <button
                  className="chat-action-btn"
                  onClick={() => handleRemoveFriend(selectedFriend._id)}
                  title="Remove friend"
                >
                  <i className="bi bi-person-dash"></i>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="messages-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-wrapper ${msg.sender === "me" ? "sent" : ""}`}
                >
                  <div className="message-content">
                    <div className="message-bubble">{msg.text}</div>
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-area">
              <div className="message-input-wrapper">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            Select a friend to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
