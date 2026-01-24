const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { addCommentSchema } = require("../schemas/commentSchemas");
const { addComment } = require("../controllers/commentController");

const router = express.Router();

router.post(
  "/comments",
  authenticateToken,
  validate(addCommentSchema),
  addComment
);

module.exports = router;
