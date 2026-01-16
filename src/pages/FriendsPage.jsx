import React from "react";
import { useState, useEffect } from "react";
import { API_URL } from "../config";
function FriendsPage({ user, socket }) {
  const [friends, setFriends] = useState([]);

  const handleRemoveFriend = async (friendId) => {
    try {
      const response = await fetch(
        `${API_URL}/users/${friendId}/remove-friend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setFriends(friends.filter((friend) => friend._id !== friendId));
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem("user"));
        currentUser.friends = currentUser.friends.filter(
          (id) => id !== friendId
        );
        localStorage.setItem("user", JSON.stringify(currentUser));
      } else {
        alert("Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  // Fetch friends list when user.friends changes (updated by global socket listener)
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
        console.log("Fetched users:", data);
        console.log("User friends:", user.friends);
        // filter only friends (if needed)
        const friendsOnly = data.filter((friend) =>
          user.friends.includes(friend._id)
        );

        setFriends(friendsOnly);
        console.log(friendsOnly);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.friends?.length]); // Only re-fetch when friends count changes

  return (
    <div className="friends-page">
      <h1>Friends</h1>
      <div className="friends-list">
        {friends.map((friend) => (
          <div key={friend._id} className="friend-item">
            <img className="friend-image" src={friend.profileImage} alt="" />
            <div className="friend-info">
              <div className="friend-name">{friend.displayName}</div>
              <div className="friend-actions">
                <button className="friend-btn message-btn">Message</button>
                <button
                  className="friend-btn remove-btn"
                  onClick={() => handleRemoveFriend(friend._id)}
                >
                  Remove Friend
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsPage;
