const User = require("../models/user");

module.exports = (socket, io) => {
  // Mark notification as read
  socket.on("markNotificationRead", async (data) => {
    const { notificationId } = data;
    const userId = socket.userId;

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
