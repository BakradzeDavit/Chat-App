const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { authenticateToken } = require("../middleware/auth");
const chatController = require("../controllers/chatController");

// ✅ All chat routes require authentication
router.use(authenticateToken);

router.post("/", chatController.createOrGetChat);

router.get("/", chatController.getUserChats);

router.get("/:chatId/messages", chatController.getChatMessages);

module.exports = router;
