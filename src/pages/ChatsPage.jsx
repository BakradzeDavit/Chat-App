import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config";
import "./ChatsPage.css";

function ChatsPage({ user, socket }) {
  const [chats, setChats] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Handle navigation from FriendsPage
  useEffect(() => {
    if (location.state?.selectedFriend) {
      setSelectedFriend(location.state.selectedFriend);
      if (location.state.chat) {
        setSelectedChat(location.state.chat);
      }
    }
  }, [location.state]);

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
        setChats(chats.filter((friend) => friend._id !== friendId));
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
    if (!message.trim() || !selectedChat || !socket) return;

    const content = message.trim();
    setMessage("");

    socket.emit("send_message", {
      chatId: selectedChat._id,
      content,
      messageType: "text",
    });
  };

  // Fetch friends list when user.friends changes
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/chats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        setChats(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChats();
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handleIncoming);
    return () => socket.off("receive_message", handleIncoming);
  }, [socket]);

  // ✅ Socket listener for online/offline status
  useEffect(() => {
    if (!socket) return;

    const handleFriendOnline = (data) => {
      const { friendId } = data;
      console.log("Friend online:", friendId);

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.otherParticipant?._id === friendId
            ? {
                ...chat,
                otherParticipant: {
                  ...chat.otherParticipant,
                  Status: "online",
                },
              }
            : chat,
        ),
      );

      if (selectedFriend?._id === friendId) {
        setSelectedFriend((prev) => ({ ...prev, Status: "online" }));
      }
    };

    const handleFriendOffline = (data) => {
      const { friendId } = data;
      console.log("Friend offline:", friendId);

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.otherParticipant?._id === friendId
            ? {
                ...chat,
                otherParticipant: {
                  ...chat.otherParticipant,
                  Status: "offline",
                },
              }
            : chat,
        ),
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

  useEffect(() => {
    if (!selectedFriend || selectedChat) return; // Skip if chat already set

    const createOrGetChat = async () => {
      try {
        const res = await fetch(`${API_URL}/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ receiverId: selectedFriend._id }),
        });

        if (!res.ok) {
          throw new Error("Failed to create/get chat");
        }

        const chat = await res.json();
        setSelectedChat(chat);
      } catch (err) {
        console.error(err);
      }
    };

    createOrGetChat();
  }, [selectedFriend?._id]);

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_URL}/messages/chats/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chats-page">
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
          {chats
            .filter(
              (chat) =>
                chat.otherParticipant?.displayName
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                (chat.displayName || chat.chatName)
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()),
            )
            .map((chat, index) => (
              <div
                key={
                  chat._id ||
                  chat.otherParticipant?._id ||
                  `${chat.chatName || "chat"}-${index}`
                }
                className={`friend-item ${selectedFriend?._id === chat.otherParticipant?._id ? "active" : ""}`}
                onClick={() => {
                  setSelectedFriend(chat.otherParticipant);
                  setSelectedChat(chat);
                }}
              >
                <div className="friend-header">
                  {chat.otherParticipant?.profileImage &&
                  (chat.otherParticipant.profileImage.startsWith("http") ||
                    chat.otherParticipant.profileImage.startsWith("data:")) ? (
                    <img
                      className="friend-image"
                      src={chat.otherParticipant?.profileImage}
                      alt=""
                    />
                  ) : (
                    <div className="friend-image placeholder">
                      {chat.otherParticipant?.displayName
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </div>
                  )}
                  <div
                    className={`friend-status-indicator ${chat.otherParticipant?.Status === "online" ? "online" : "offline"}`}
                  ></div>
                </div>
                <div className="friend-info">
                  <div className="friend-name-row">
                    <span className="friend-name">
                      {chat.otherParticipant?.displayName || chat.chatName}
                    </span>
                    <span className="friend-time"></span>
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
                  {selectedFriend.profileImage &&
                  (selectedFriend.profileImage.startsWith("http") ||
                    selectedFriend.profileImage.startsWith("data:")) ? (
                    <img src={selectedFriend.profileImage} alt="" />
                  ) : (
                    <div className="friend-image placeholder header-placeholder">
                      {selectedFriend.displayName?.charAt(0).toUpperCase() ||
                        "U"}
                    </div>
                  )}
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
              {messages.map((msg, index) => {
                const currentUserId = user._id || user.id;
                const msgSenderId =
                  typeof msg.sender === "object" ? msg.sender._id : msg.sender;
                const isMyMessage = msgSenderId === currentUserId;

                return (
                  <div
                    key={
                      msg._id ||
                      msg.id ||
                      `${msg.sender || "user"}-${msg.createdAt || "time"}-${index}`
                    }
                    className={`message-wrapper ${isMyMessage ? "sent" : ""}`}
                  >
                    <div className="message-content">
                      <div className="message-bubble">
                        {msg.content || msg.text}
                      </div>
                      <span className="message-time">
                        {new Date(
                          msg.createdAt || msg.timestamp,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-area">
              <div className="message-input-wrapper">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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

export default ChatsPage;
