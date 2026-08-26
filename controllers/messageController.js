const Message = require("../models/Message");
const Chat = require("../models/Chat");

// ✅ Create a new message
exports.createMessage = async (req, res, next) => {
  try {
    const { chatId, content, messageType, attachments, replyTo } = req.body;
    const sender = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isParticipant = chat.participants.some(
      (id) => id.toString() === sender,
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await Message.create({
      chatId,
      sender,
      content,
      messageType,
      attachments: attachments || [],
      replyTo: replyTo || null,
      readBy: [sender],
    });

    chat.lastMessage = {
      sender,
      content,
      timestamp: message.createdAt,
    };
    await chat.save();

    await message.populate("sender", "username profilePicture");

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// ✅ Get messages for a specific chat
exports.getMessagesByChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ chatId })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// ✅ Mark a message as read by the current user
exports.markMessageAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is in the chat
    const chat = await Chat.findById(message.chatId);
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json({ message: "Message marked as read" });
  } catch (error) {
    next(error);
  }
};
