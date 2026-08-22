const jwt = require("jsonwebtoken");
const chatSocket = require("./chat.socket");
const notifSocket = require("./notif.socket");
const userSocket = require("./user.socket");
const messageSocket = require("./message.socket");
const reactionSocket = require("./reaction.socket");

module.exports = (io) => {
  io.userConnections = io.userConnections || new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      socket.userId = String(decoded.id);

      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Initialize socket handlers
    chatSocket(socket, io);
    notifSocket(socket, io);
    userSocket(socket, io);
    messageSocket(socket, io);
    reactionSocket(socket, io);
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
