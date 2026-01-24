const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createPostSchema, postIdParamSchema } = require("../schemas/postSchemas");
const {
  createPost,
  getPosts,
  deletePost,
  likePost,
} = require("../controllers/postController");

const router = express.Router();

// ✅ FIXED: Create post with denormalized data and validation
router.post(
  "/create-post",
  authenticateToken,
  validate(createPostSchema),
  createPost
);

// ✅ FIXED: Get posts (no need to populate if denormalized)
router.get("/posts", authenticateToken, getPosts);

// ✅ NEW: Delete post endpoint with validation
router.delete(
  "/posts/:postId",
  authenticateToken,
  validate(postIdParamSchema),
  deletePost
);

router.post(
  "/posts/:postId/like",
  authenticateToken,
  validate(postIdParamSchema),
  likePost
);

module.exports = router;
