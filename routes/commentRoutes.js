const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { addComment } = require("../controllers/commentController");

const router = express.Router();

router.post("/comments", authenticateToken, addComment);

module.exports = router;
