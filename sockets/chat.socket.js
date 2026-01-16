const Chat = require("../models/Chat");

module.exports = (socket, io) => {
  // Join a chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Send a message
  socket.on("sendMessage", async (data) => {
    const { chatId, content, senderId } = data;

    try {
      // Find the chat and add the message
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("error", "Chat not found");
        return;
      }

      const newMessage = {
        sender: senderId,
        content,
        timestamp: new Date(),
      };

      chat.messages.push(newMessage);
      await chat.save();

      // Emit to all users in the chat room
      io.to(chatId).emit("newMessage", newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Leave chat
  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });
};
