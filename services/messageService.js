const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { messagePayloadSchema } = require("../schemas/messageSchemas");
const PUBLIC_SENDER_FIELDS = "displayName profileImage";

const createMessage = async ({
  senderId,
  chatId,
  content,
  messageType = "text",
  attachments = [],
  replyTo,
}) => {
  const result = messagePayloadSchema.safeParse({
    chatId,
    content,
    messageType,
    attachments,
    replyTo,
  });

  if (!result.success) {
    const error = new Error("Invalid message data");
    error.status = 400;
    throw error;
  }
  const validated = result.data;
  const chat = await Chat.findById(validated.chatId);

  if (!chat) {
    const error = new Error("Chat not found");
    error.status = 404;
    throw error;
  }

  const isParticipant = chat.participants.some(
    (id) => String(id) === String(senderId),
  );

  if (!isParticipant) {
    const error = new Error("Access denied");
    error.status = 403;
    throw error;
  }

  const message = await Message.create({
    chatId: validated.chatId,
    sender: senderId,
    content: validated.content,
    messageType: validated.messageType,
    attachments: validated.attachments || [],
    replyTo: validated.replyTo || null,
    readBy: [senderId],
  });

  chat.lastMessage = {
    sender: senderId,
    content: validated.content,
    timestamp: message.createdAt,
  };

  await chat.save();

  await message.populate("sender", PUBLIC_SENDER_FIELDS);

  return message;
};

module.exports = {
  createMessage,
  PUBLIC_SENDER_FIELDS,
};
