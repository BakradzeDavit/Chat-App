const Message = require("../models/Message");
const Chat = require("../models/Chat");

module.exports = (socket, io) => {
  socket.on("send_message", async (data) => {
    try {
      const {
        chatId,
        content,
        messageType = "text",
        attachments = [],
        replyTo = null,
      } = data || {};

      const senderId = socket.userId;
      if (!chatId || !senderId) {
        socket.emit("message_error", {
          message: "Missing chatId or sender",
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("message_error", { message: "Chat not found" });
        return;
      }

      const isParticipant = chat.participants.some(
        (id) => id.toString() === senderId.toString(),
      );
      if (!isParticipant) {
        socket.emit("message_error", { message: "Access denied" });
        return;
      }

      const message = await Message.create({
        chatId,
        sender: senderId,
        content,
        messageType,
        attachments,
        replyTo,
        readBy: [senderId],
      });

      chat.lastMessage = {
        sender: senderId,
        content,
        timestamp: message.createdAt,
      };
      await chat.save();

      await message.populate("sender", "username profilePicture");

      io.to(String(chatId)).emit("receive_message", message);
    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("message_error", {
        message: "Error sending message",
        error: error.message,
      });
    }
  });
};
