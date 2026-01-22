const chatSocket = require("./chat.socket");
const notifSocket = require("./notif.socket");
const userSocket = require("./user.socket");
const User = require("../models/user");

module.exports = (io) => {
  io.userConnections = io.userConnections || new Map();

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Get user ID from socket handshake
    const userId =
      socket.handshake.auth.userId || socket.handshake.query.userId;

    if (userId) {
      socket.userId = userId;
    }

    // Initialize socket handlers
    chatSocket(socket, io);
    notifSocket(socket, io);
    userSocket(socket, io);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
