const User = require("../models/user");

const updatePresence = async (io, userId, status) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { Status: status },
      { new: true },
    ).select("friends");

    if (!user) return;

    const eventName = status === "online" ? "friendOnline" : "friendOffline";
    user.friends.forEach((friendId) => {
      io.to(`user_${friendId}`).emit(eventName, {
        friendId: String(userId),
      });
    });

    console.log(`User ${userId} is now ${status}`);
  } catch (error) {
    console.error(`Error marking user ${status}:`, error);
  }
};

module.exports = (socket, io) => {
  const unregisterConnection = async () => {
    const userId = socket.userId;
    if (!userId) return;

    const connections = io.userConnections.get(userId);
    if (!connections || !connections.delete(socket.id)) return;

    if (connections.size > 0) {
      io.userConnections.set(userId, connections);
      return;
    }

    io.userConnections.delete(userId);
    await updatePresence(io, userId, "offline");
  };

  // User goes online
  socket.on("userOnline", async () => {
    const userId = socket.userId;
    console.log("Authenticated socket user:", socket.userId);
    if (!userId) return;

    socket.join(`user_${userId}`);

    const connections = io.userConnections.get(userId) || new Set();

    if (connections.has(socket.id)) return;

    const wasOffline = connections.size === 0;

    connections.add(socket.id);
    io.userConnections.set(userId, connections);

    console.log(`User ${userId} registered socket ${socket.id}`);

    if (wasOffline) {
      await updatePresence(io, userId, "online");
    }
  });

  // Send friend request
  socket.on("sendFriendRequest", async (data) => {
    const { receiverId } = data;
    const senderId = socket.userId;
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
    const { friendId } = data;
    const userId = socket.userId;
    try {
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
      if (!user || !friend) {
        return socket.emit("error", "User not found");
      }
      const requestExists = friend.friendRequestsSent.some(
        (id) => String(id) === String(userId),
      );

      if (!requestExists) {
        return socket.emit("error", "No friend request from this user");
      }
      user.friends.push(friendId);
      friend.friends.push(userId);

      user.friendRequestsReceived = user.friendRequestsReceived.filter(
        (id) => String(id) !== String(friendId),
      );

      friend.friendRequestsSent = friend.friendRequestsSent.filter(
        (id) => String(id) !== String(userId),
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
    await unregisterConnection();
  });

  socket.on("userOffline", async () => {
    await unregisterConnection();
  });

  // User explicitly logs out
  socket.on("userLogout", async () => {
    await unregisterConnection();
    socket.disconnect(true);
  });
};
