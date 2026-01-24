const User = require("../models/user");

module.exports = (socket, io) => {
  // User goes online
  socket.on("userOnline", async (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(
      `✅ User ${userId} joined room user_${userId}, socket ID: ${socket.id}`,
    );

    const prevCount = io.userConnections.get(userId) || 0;
    io.userConnections.set(userId, prevCount + 1);

    // Always update status to online to handle reconnections reliably
    try {
      await User.findByIdAndUpdate(userId, { Status: "online" });
      console.log(`User ${userId} is now online (force update)`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }

    if (prevCount === 0) {
      // Emit to friends that user is online (only if they were offline before)
      // Actually, we should probably emit this always too? 
      // If we emit always, friends get "online" event multiple times.
      // Front-end handles it (idempotent state update).
      // But let's stick to only emitting if new connection, OR just emit safely.
      // If we emit always, it ensures friends UI is consistent.
      try {
        const user = await User.findById(userId).populate("friends");
        user.friends.forEach((friend) => {
          io.to(`user_${friend._id}`).emit("friendOnline", { friendId: userId });
        });
      } catch (error) {
        console.error("Error emitting friend online:", error);
      }
    } else {
      // Even if prevCount > 0, we might want to emit to be safe? 
      // Let's keep emission inside prevCount === 0 for noise reduction, 
      // but the DB update is the critical "100%" fix.
      // Wait, if server restarted, prevCount is 0 for everyone reconnecting.
      // So logic holds.
    }
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
        (id) => id.toString() !== friendId,
      );
      friend.friendRequestsSent = friend.friendRequestsSent.filter(
        (id) => id.toString() !== userId,
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
  socket.on("disconnect", async () => {
    if (socket.userId) {
      console.log(`User ${socket.userId} disconnected`);

      const prevCount = io.userConnections.get(socket.userId) || 0;
      const newCount = prevCount - 1;

      if (newCount <= 0) {
        io.userConnections.delete(socket.userId);

        // Update user status to offline
        try {
          await User.findByIdAndUpdate(socket.userId, { Status: "offline" });
          console.log(`User ${socket.userId} is now offline`);
        } catch (error) {
          console.error("Error updating user status:", error);
        }

        // Emit to friends that user is offline
        try {
          const user = await User.findById(socket.userId).populate("friends");
          user.friends.forEach((friend) => {
            io.to(`user_${friend._id}`).emit("friendOffline", {
              friendId: socket.userId,
            });
          });
        } catch (error) {
          console.error("Error emitting friend offline:", error);
        }
      } else {
        io.userConnections.set(socket.userId, newCount);
      }
    }
  });
  // User explicitly logs out
  socket.on("userLogout", async (userId) => {
    console.log(`User ${userId} logging out (force offline)`);
    
    // Force remove connection count
    io.userConnections.delete(userId);

    // Update user status to offline
    try {
      await User.findByIdAndUpdate(userId, { Status: "offline" });
      console.log(`User ${userId} marked offline (logout)`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }

    // Emit to friends that user is offline
    try {
      const user = await User.findById(userId).populate("friends");
      if (user && user.friends) {
        user.friends.forEach((friend) => {
          io.to(`user_${friend._id}`).emit("friendOffline", {
            friendId: userId,
          });
        });
      }
    } catch (error) {
      console.error("Error emitting friend offline:", error);
    }
    
    // Disconnect socket
    socket.disconnect();
  });
};
