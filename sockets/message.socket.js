const { isRateLimited } = require("./socketratelimit");
const { createMessage } = require("../services/messageService");
module.exports = (socket, io) => {
  socket.on("send_message", async (data) => {
    if (isRateLimited(socket.id, "sendMessage", 20, 10_000)) {
      return socket.emit("error", "You're sending messages too quickly.");
    }
    try {
      const {
        chatId,
        content,
        messageType = "text",
        attachments = [],
        replyTo = null,
      } = data || {};

      const senderId = socket.userId;

      const message = await createMessage({
        chatId,
        senderId,
        content,
        messageType,
        attachments,
        replyTo,
      });

      io.to(String(chatId)).emit("receive_message", message);
    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("message_error", {
        message: "Error sending message",
      });
    }
  });
};
