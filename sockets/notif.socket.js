const User = require("../models/user");

module.exports = (socket, io) => {
  // Send a notification to a user
  socket.on("sendNotification", async (data) => {
    const { userId, type, senderId, postId } = data;

    try {
      const user = await User.findById(userId);
      if (!user) {
        socket.emit("error", "User not found");
        return;
      }

      const notification = {
        type,
        sender: senderId,
        post: postId,
        createdAt: new Date(),
        Read: false,
      };

      user.Notifications.push(notification);
      await user.save();

      // Emit to the user's socket (assuming socket is associated with user)
      // For simplicity, emit to socket, but ideally use user rooms
      socket.emit("newNotification", notification);
    } catch (error) {
      console.error("Error sending notification:", error);
      socket.emit("error", "Failed to send notification");
    }
  });

  // Mark notification as read
  socket.on("markNotificationRead", async (data) => {
    const { notificationId, userId } = data;

    try {
      const user = await User.findById(userId);
      const notification = user.Notifications.id(notificationId);
      if (notification) {
        notification.Read = true;
        await user.save();
        socket.emit("notificationUpdated", notification);
      }
    } catch (error) {
      console.error("Error marking notification read:", error);
      socket.emit("error", "Failed to update notification");
    }
  });
};
