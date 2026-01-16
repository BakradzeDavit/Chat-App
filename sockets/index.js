const chatSocket = require("./chat.socket");
const notifSocket = require("./notif.socket");
const userSocket = require("./user.socket");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Initialize socket handlers
    chatSocket(socket, io);
    notifSocket(socket, io);
    userSocket(socket, io);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
