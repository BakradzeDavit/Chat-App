const Message = require("../models/Message");
const Chat = require("../models/Chat");

// ✅ Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { chatId, content, messageType } = req.body;
    const sender = req.user.id; // Assuming auth middleware sets req.user

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    if (!chat.participants.includes(sender)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = new Message({
      chatId,
      sender,
      content,
      messageType: messageType || "text",
    });
    await message.save();

    // Update chat's lastMessage
    chat.lastMessage = {
      sender,
      content,
      timestamp: message.createdAt,
    };
    await chat.save();

    // Populate sender for response
    await message.populate("sender", "username profilePicture");

    res.status(201).json(message);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating message", error: error.message });
  }
};

// ✅ Get messages for a specific chat
exports.getMessagesByChat = async (req, res) => {
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
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
};

// ✅ Mark a message as read by the current user
exports.markMessageAsRead = async (req, res) => {
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
    res
      .status(500)
      .json({ message: "Error marking message as read", error: error.message });
  }
};
