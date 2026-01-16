const mongoose = require("mongoose");
const userModel = require("../models/user");
const PostModel = require("../models/Post");
const cloudinary = require("../config/cloudinary");

// ✅ Update username
const updateUsername = async (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;
  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { displayName: username },
      { new: true }
    );
    await PostModel.updateMany({ author: userId }, { displayName: username });
    res.status(200).json({
      message: "Username updated",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (err) {
    console.error("Error updating username:", err);
    res
      .status(500)
      .json({ message: "Error updating username", error: err.message });
  }
};

// ✅ Upload profile picture
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "profile_pictures" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    );
    await PostModel.updateMany(
      { author: req.user.id },
      { profileImage: result.secure_url }
    );
    res.json({
      message: "Profile picture uploaded successfully",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    res.status(500).json({
      message: "Error uploading profile picture",
      error: err.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await userModel
      .findById(id)
      .select(
        "displayName email profileImage backgroundImage PostsCount friends Notifications"
      )
      .populate("Notifications.sender", "displayName profileImage");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch current user to check friend status
    const currentUser = await userModel.findById(req.user.id);
    const isFriend = currentUser.friends.some(
      (friendId) => friendId.toString() === id
    );
    const hasSentRequest = currentUser.friendRequestsSent.some(
      (reqId) => reqId.toString() === id
    );
    const hasReceivedRequest = currentUser.friendRequestsReceived.some(
      (reqId) => reqId.toString() === id
    );

    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage,
        PostsCount: user.PostsCount,
        friends: user.friends,
        isFriend,
        hasSentRequest,
        hasReceivedRequest,
        Notifications: user.Notifications,
      },
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      message: "Error fetching user",
      error: err.message,
    });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const senderId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (targetUserId === senderId) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }
    const sender = await userModel.findById(senderId);
    const target = await userModel.findById(targetUserId);

    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    if (sender.friends.includes(targetUserId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    if (sender.friendRequestsSent.includes(targetUserId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if request already received (though unlikely)
    if (target.friendRequestsReceived.includes(senderId)) {
      return res.status(400).json({ message: "Friend request already exists" });
    }

    // Add to sent and received
    sender.friendRequestsSent.push(targetUserId);
    target.friendRequestsReceived.push(senderId);

    // Check if notification already exists
    const notificationExists = target.Notifications.some(
      (n) =>
        n.type === "friendRequest" &&
        n.sender.toString() === sender._id.toString()
    );

    if (!notificationExists) {
      target.Notifications.push({
        type: "friendRequest",
        sender: sender._id,
      });
    }

    await sender.save();
    await target.save();

    // Emit socket event for new friend request notification  
    if (req.io) {
      // Get the last notification (the one we just added)
      const lastNotification = target.Notifications[target.Notifications.length - 1];
      
      req.io.to(`user_${targetUserId}`).emit("newNotification", {
        _id: lastNotification._id,
        type: "friendRequest",
        sender: {
          _id: sender._id,
          displayName: sender.displayName,
          profileImage: sender.profileImage,
        },
        createdAt: lastNotification.createdAt,
        Read: false,
      });
      console.log(`Emitted friendRequest notification to user_${targetUserId}`);
    }

    res.json({ message: "Friend request sent successfully" });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({
      message: "Error sending friend request",
      error: err.message,
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const receiver = await userModel.findById(receiverId);
    const sender = await userModel.findById(senderId);

    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request exists
    if (!receiver.friendRequestsReceived.includes(senderId)) {
      return res
        .status(400)
        .json({ message: "No friend request from this user" });
    }

    // Add to friends
    receiver.friends.push(senderId);
    sender.friends.push(receiverId);

    // Remove from requests
    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(
      (id) => id.toString() !== senderId
    );
    sender.friendRequestsSent = sender.friendRequestsSent.filter(
      (id) => id.toString() !== receiverId
    );

    // Remove notification
    receiver.Notifications = receiver.Notifications.filter(
      (n) =>
        !(
          n.type === "friendRequest" &&
          n.sender.toString() === sender._id.toString()
        )
    );

    await receiver.save();
    await sender.save();

    // Emit socket events for real-time updates
    if (req.io) {
      console.log(`Emitting friendAdded to user_${receiverId} and user_${senderId}`);
      req.io.to(`user_${receiverId}`).emit("friendAdded", { friendId: senderId });
      req.io.to(`user_${senderId}`).emit("friendAdded", { friendId: receiverId });
    } else {
      console.log("WARNING: req.io is not available");
    }

    res.json({ message: "Friend request accepted successfully" });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({
      message: "Error accepting friend request",
      error: err.message,
    });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const senderId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const sender = await userModel.findById(senderId);
    const target = await userModel.findById(targetUserId);

    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from sent and received
    sender.friendRequestsSent = sender.friendRequestsSent.filter(
      (id) => id.toString() !== targetUserId
    );
    target.friendRequestsReceived = target.friendRequestsReceived.filter(
      (id) => id.toString() !== senderId
    );

    // Remove notification from target
    target.Notifications = target.Notifications.filter(
      (n) =>
        !(
          n.type === "friendRequest" &&
          n.sender.toString() === sender._id.toString()
        )
    );

    await sender.save();
    await target.save();

    res.json({ message: "Friend request canceled successfully" });
  } catch (err) {
    console.error("Error canceling friend request:", err);
    res.status(500).json({
      message: "Error canceling friend request",
      error: err.message,
    });
  }
};

const getFriendRequestsReceived = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel
      .findById(userId)
      .populate("friendRequestsReceived", "displayName email profileImage");
    res.json({ friendRequests: user.friendRequestsReceived });
  } catch (err) {
    console.error("Error fetching friend requests received:", err);
    res.status(500).json({
      message: "Error fetching friend requests received",
      error: err.message,
    });
  }
};

const getFriendRequestsSent = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel
      .findById(userId)
      .populate("friendRequestsSent", "displayName email profileImage");
    res.json({ friendRequests: user.friendRequestsSent });
  } catch (err) {
    console.error("Error fetching friend requests sent:", err);
    res.status(500).json({
      message: "Error fetching friend requests sent",
      error: err.message,
    });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { id: friendId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await userModel.findById(userId);
    const friend = await userModel.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from both friends arrays
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    await user.save();
    await friend.save();

    // Emit socket events for real-time updates
    if (req.io) {
      console.log(`Emitting friendRemoved to user_${userId} and user_${friendId}`);
      req.io.to(`user_${userId}`).emit("friendRemoved", { friendId });
      req.io.to(`user_${friendId}`).emit("friendRemoved", { friendId: userId });
    } else {
      console.log("WARNING: req.io is not available");
    }

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error("Error removing friend:", err);
    res.status(500).json({
      message: "Error removing friend",
      error: err.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await userModel.find(
      { _id: { $ne: req.user.id } },
      "displayName profileImage _id" // only safe fields
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete notification endpoint
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const user = await userModel.findById(userId);
    user.Notifications = user.Notifications.filter(
      (n) => n._id.toString() !== notificationId
    );
    await user.save();

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res
      .status(500)
      .json({ message: "Error deleting notification", error: err.message });
  }
};

module.exports = {
  updateUsername,
  uploadProfilePic,
  getUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequestsReceived,
  getFriendRequestsSent,
  removeFriend,
  getUsers,
  deleteNotification,
};
