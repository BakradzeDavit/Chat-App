const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  createPost,
  getPosts,
  deletePost,
  likePost,
} = require("../controllers/postController");

const router = express.Router();

// ✅ FIXED: Create post with denormalized data
router.post("/create-post", authenticateToken, createPost);

// ✅ FIXED: Get posts (no need to populate if denormalized)
router.get("/posts", authenticateToken, getPosts);

// ✅ NEW: Delete post endpoint
router.delete("/posts/:postId", authenticateToken, deletePost);

router.post("/posts/:postId/like", authenticateToken, likePost);

module.exports = router;
