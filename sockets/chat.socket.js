const Chat = require("../models/Chat");

module.exports = (socket, io) => {
  // Join a chat room
  socket.on("joinChat", async (chatId) => {
    try {
      if (!chatId) return;

      const chat = await Chat.findById(chatId);

      if (!chat) {
        console.log("Chat not found");
        return;
      }

      const isParticipant = chat.participants.some(
        (participantId) => String(participantId) === String(socket.userId),
      );

      if (!isParticipant) {
        console.log("Access denied");
        return;
      }

      const roomName = String(chatId);
      socket.join(roomName);

      console.log(`User ${socket.id} joined chat ${roomName}`);
    } catch (error) {
      console.error("joinChat error:", error.message);
    }
  });

  // Leave chat
  socket.on("leaveChat", (chatId) => {
    if (!chatId) return;

    const roomName = String(chatId);
    socket.leave(roomName);
    console.log(`User ${socket.id} left chat ${roomName}`);
  });
};
