import { API_URL } from "../config";

const handleFriendRequest = async (id, setFriendStatus) => {
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
      if (setFriendStatus) setFriendStatus("sent");
      return { success: true };
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
      return { success: false };
    }
  } catch (error) {
    console.error("Error sending friend request:", error);
    alert("An error occurred while sending the friend request.");
    return { success: false };
  }
};

const handleAcceptRequest = async (id, setFriendStatus) => {
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
      if (setFriendStatus) setFriendStatus("friends");
      return { success: true };
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
      return { success: false };
    }
  } catch (error) {
    console.error("Error accepting friend request:", error);
    alert("An error occurred while accepting the friend request.");
    return { success: false };
  }
};

const handleDeclineRequest = async (id, setFriendStatus) => {
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
      if (setFriendStatus) setFriendStatus("none");
      return { success: true };
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
      return { success: false };
    }
  } catch (error) {
    console.error("Error canceling friend request:", error);
    alert("An error occurred while canceling the friend request.");
    return { success: false };
  }
};

const handleRemoveFriend = async (id, setFriendStatus) => {
  try {
    const response = await fetch(
      `${API_URL}/users/${id}/remove-friend`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (response.ok) {
      alert("Friend removed successfully!");
      if (setFriendStatus) setFriendStatus("none");
      return { success: true };
    } else {
      try {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          alert(`Failed to remove friend: ${errorData.message}`);
        } catch (jsonParseError) {
          alert(
            `Failed to remove friend: Server returned non-JSON response (status ${response.status}): ${responseText}`,
          );
        }
      } catch (textError) {
        alert(
          `Failed to remove friend: Unable to read server response (status ${response.status})`,
        );
      }
      return { success: false };
    }
  } catch (error) {
    console.error("Error removing friend:", error);
    alert("An error occurred while removing the friend.");
    return { success: false };
  }
};

const handleRejectRequest = async (id, setFriendStatus) => {
  try {
    const response = await fetch(
      `${API_URL}/users/${id}/decline-friend-request`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (response.ok) {
      alert("Friend request rejected!");
      if (setFriendStatus) setFriendStatus("none");
      return { success: true };
    } else {
      try {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          alert(`Failed to reject friend request: ${errorData.message}`);
        } catch (jsonParseError) {
          alert(
            `Failed to reject friend request: Server returned non-JSON response (status ${response.status}): ${responseText}`,
          );
        }
      } catch (textError) {
        alert(
          `Failed to reject friend request: Unable to read server response (status ${response.status})`,
        );
      }
      return { success: false };
    }
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    alert("An error occurred while rejecting the friend request.");
    return { success: false };
  }
};

export {
  handleFriendRequest,
  handleAcceptRequest,
  handleDeclineRequest,
  handleRemoveFriend,
  handleRejectRequest,
};

export default {
  handleFriendRequest,
  handleAcceptRequest,
  handleDeclineRequest,
  handleRemoveFriend,
  handleRejectRequest,
};
