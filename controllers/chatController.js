const Chat = require("../models/Chat");
const Message = require("../models/Message");

const createOrGetChat = async (req, res) => {
  try {
    const senderId = req.user.id; // From authenticateToken
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }

    // Sort participants for consistency
    const participants = [senderId, receiverId].sort();

    // Try to find existing chat
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: participants, $size: 2 },
    });

    // Create new chat if it doesn't exist
    if (!chat) {
      chat = await Chat.create({
        participants,
        lastMessage: null,
        isGroup: false,
      });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error creating/getting chat:", error);
    res.status(500).json({ error: "Failed to create or get chat" });
  }
};
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "displayName profileImage")
      .populate("lastMessage.sender", "displayName profileImage")
      .sort({ "lastMessage.timestamp": -1 });

    // Format chats to include otherParticipant
    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId,
      );

      return {
        ...chat.toObject(),
        otherParticipant,
        chatName: chat.isGroup ? chat.groupName : otherParticipant?.displayName,
        chatImage: chat.isGroup
          ? chat.groupImage
          : otherParticipant?.profileImage,
      };
    });

    res.status(200).json(formattedChats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is part of the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Get messages with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "displayName profileImage");

    res.status(200).json({
      messages,
      currentPage: page,
      totalPages: Math.ceil(
        (await Message.countDocuments({ chatId })) / limit,
      ),
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

module.exports = {
  createOrGetChat,
  getUserChats,
  getChatMessages,
};
