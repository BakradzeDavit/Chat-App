const User = require("../models/user");

module.exports = (socket, io) => {
  // User goes online
  socket.on("userOnline", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined room user_${userId}, socket ID: ${socket.id}`);
    // Emit to friends that user is online
    // For simplicity, just log
  });

  // Send friend request
  socket.on("sendFriendRequest", async (data) => {
    const { senderId, receiverId } = data;

    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        socket.emit("error", "User not found");
        return;
      }

      if (!receiver.friendRequestsReceived.includes(senderId)) {
        receiver.friendRequestsReceived.push(senderId);
        sender.friendRequestsSent.push(receiverId);
        await sender.save();
        await receiver.save();

        // Emit to receiver
        io.to(`user_${receiverId}`).emit("friendRequestReceived", { senderId });
        socket.emit("friendRequestSent", { receiverId });
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      socket.emit("error", "Failed to send friend request");
    }
  });

  // Accept friend request
  socket.on("acceptFriendRequest", async (data) => {
    const { userId, friendId } = data;

    try {
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);

      user.friends.push(friendId);
      friend.friends.push(userId);

      user.friendRequestsReceived = user.friendRequestsReceived.filter(
        (id) => id.toString() !== friendId
      );
      friend.friendRequestsSent = friend.friendRequestsSent.filter(
        (id) => id.toString() !== userId
      );

      await user.save();
      await friend.save();

      io.to(`user_${userId}`).emit("friendAdded", { friendId });
      io.to(`user_${friendId}`).emit("friendAdded", { friendId: userId });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      socket.emit("error", "Failed to accept friend request");
    }
  });

  // User disconnects
  socket.on("disconnect", () => {
    if (socket.userId) {
      console.log(`User ${socket.userId} disconnected`);
      // Could emit offline status
    }
  });
};
