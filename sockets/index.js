const jwt = require("jsonwebtoken");
const { parseCookie } = require("cookie");
const chatSocket = require("./chat.socket");
const notifSocket = require("./notif.socket");
const userSocket = require("./user.socket");
const messageSocket = require("./message.socket");
const reactionSocket = require("./reaction.socket");
const User = require("../models/user");
module.exports = (io) => {
  io.userConnections = io.userConnections || new Map();

  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("Authentication error: No cookie provided"));
    }
    const cookies = parseCookie(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: User no longer exists"));
      }
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
