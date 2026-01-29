const Chat = require("../models/Chat");

// ✅ Create a private chat (1-on-1)
exports.createPrivateChat = async (req, res) => {
  try {
    const { participants } = req.body;

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: participants, $size: 2 },
      isGroup: false,
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const chat = new Chat({ participants, isGroup: false });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating private chat", error: error.message });
  }
};

// ✅ Create a group chat
exports.createGroupChat = async (req, res) => {
  try {
    const { participants, groupName, groupImage } = req.body;

    const chat = new Chat({
      participants,
      isGroup: true,
      groupName,
      groupImage,
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating group chat", error: error.message });
  }
};

// ✅ Get all chats for the authenticated user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware sets req.user

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "username profilePicture")
      .sort({ "lastMessage.timestamp": -1 });

    res.json(chats);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching chats", error: error.message });
  }
};

// ✅ Get a specific chat by ID
exports.getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id).populate(
      "participants",
      "username profilePicture",
    );
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is participant
    if (!chat.participants.some((p) => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(chat);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching chat", error: error.message });
  }
};

// ✅ Update group chat (name/image)
exports.updateGroupChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, groupImage } = req.body;

    const chat = await Chat.findById(id);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    chat.groupName = groupName || chat.groupName;
    chat.groupImage = groupImage || chat.groupImage;
    await chat.save();

    res.json(chat);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating group chat", error: error.message });
  }
};
