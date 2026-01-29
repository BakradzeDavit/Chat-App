const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { authenticateToken } = require("../middleware/auth");
const {
  createPrivateChatSchema,
  createGroupChatSchema,
  chatIdParamSchema,
  updateGroupChatSchema,
} = require("../schemas/chatSchemas");
const chatController = require("../controllers/chatController");

// ✅ All chat routes require authentication
router.use(authenticateToken);

// ✅ Create private chat
router.post(
  "/private",
  validate(createPrivateChatSchema),
  chatController.createPrivateChat,
);

// ✅ Create group chat
router.post(
  "/group",
  validate(createGroupChatSchema),
  chatController.createGroupChat,
);

// ✅ Get user's chats
router.get("/", chatController.getUserChats);

// ✅ Get specific chat
router.get("/:id", validate(chatIdParamSchema), chatController.getChatById);

// ✅ Update group chat
router.put(
  "/:id",
  validate(chatIdParamSchema),
  validate(updateGroupChatSchema),
  chatController.updateGroupChat,
);

module.exports = router;
