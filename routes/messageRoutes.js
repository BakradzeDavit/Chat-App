const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { authenticateToken } = require("../middleware/auth");
const {
  createMessageSchema,
  messageIdParamSchema,
  chatIdParamSchema,
} = require("../schemas/messageSchemas");
const messageController = require("../controllers/messageController");

// ✅ All message routes require authentication
router.use(authenticateToken);

// ✅ Create message
router.post(
  "/",
  validate(createMessageSchema),
  messageController.createMessage,
);

// ✅ Get messages by chat
router.get(
  "/chats/:chatId",
  validate(chatIdParamSchema),
  messageController.getMessagesByChat,
);

// ✅ Mark message as read
router.put(
  "/:id/read",
  validate(messageIdParamSchema),
  messageController.markMessageAsRead,
);

module.exports = router;
