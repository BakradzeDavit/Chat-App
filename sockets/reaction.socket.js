const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { reactMessageSchema } = require("../schemas/messageSchemas");

const { isRateLimited } = require("./socketRateLimit");
// Runs whenever this connected user clicks an emoji reaction.
module.exports = (socket, io) => {
  socket.on("react_message", async ({ chatId, messageId, emoji }) => {
    if (isRateLimited(socket.id, "reaction", 30, 10_000)) {
      return socket.emit("error", "You're reacting too quickly.");
    }

    if (typeof emoji !== "string" || emoji.length > 10) {
      return socket.emit("reaction_error", {
        message: "Invalid reaction.",
      });
    }

    try {
      const validation = reactMessageSchema.safeParse({
        chatId,
        messageId,
        emoji,
      });

      if (!validation.success) {
        return socket.emit("reaction_error", {
          message: "Invalid reaction data",
        });
      }

      const userId = socket.userId;

      if (!userId) {
        return socket.emit("reaction_error", {
          message: "You must be logged in to react",
        });
      }

      const message = await Message.findOne({
        _id: messageId,
        chatId,
      });

      if (!message) {
        return socket.emit("reaction_error", {
          message: "Message not found",
        });
      }

      const chat = await Chat.findById(chatId);

      const isParticipant = chat?.participants.some(
        (participantId) => String(participantId) === String(userId),
      );

      if (!isParticipant) {
        return socket.emit("reaction_error", {
          message: "Access denied",
        });
      }

      const reactionIndex = message.reactions.findIndex(
        (reaction) =>
          String(reaction.user) === String(userId) && reaction.emoji === emoji,
      );

      if (reactionIndex !== -1) {
        message.reactions.splice(reactionIndex, 1);
      } else {
        message.reactions.push({
          user: userId,
          emoji,
        });
      }

      await message.save();

      const roomName = String(chatId);

      if (!socket.rooms.has(roomName)) {
        await socket.join(roomName);
      }

      io.to(roomName).emit("message_reaction_updated", message);
    } catch (error) {
      console.error("Reaction error:", error);

      socket.emit("reaction_error", {
        message: "Could not update reaction",
      });
    }
  });
};
