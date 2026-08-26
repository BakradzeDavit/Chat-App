const { isRateLimited } = require("./socketratelimit");
const { createMessage } = require("../services/messageService");

module.exports = (socket, io) => {
  socket.on("send_message", async (data, ack) => {
    if (isRateLimited(socket.id, "sendMessage", 20, 10_000)) {
      return ack?.({
        ok: false,
        message: "You're sending messages too quickly.",
      });
    }

    try {
      const {
        chatId,
        content,
        clientMessageId,
        messageType = "text",
        attachments = [],
        replyTo,
      } = data || {};

      const senderId = socket.userId;

      const { message, created } = await createMessage({
        chatId,
        senderId,
        clientMessageId,
        content,
        messageType,
        attachments,
        replyTo,
      });

      if (created) {
        io.to(String(chatId)).emit("receive_message", message);
      }

      ack?.({
        ok: true,
        message,
        created,
      });
    } catch (error) {
      console.error("Socket message error:", error);

      ack?.({
        ok: false,
        message:
          error.status && error.status < 500
            ? error.message
            : "Error sending message",
      });
    }
  });
};
