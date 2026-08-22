const Chat = require("../models/Chat");

module.exports = (socket, io) => {
  // Join a chat room
  socket.on("joinChat", (chatId) => {
    if (!chatId) return;

    const roomName = String(chatId);
    socket.join(roomName);
    console.log(`User ${socket.id} joined chat ${roomName}`);
  });

  // Leave chat
  socket.on("leaveChat", (chatId) => {
    if (!chatId) return;

    const roomName = String(chatId);
    socket.leave(roomName);
    console.log(`User ${socket.id} left chat ${roomName}`);
  });
};
