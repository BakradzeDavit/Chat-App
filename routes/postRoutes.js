const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createPostSchema,
  postIdParamSchema,
} = require("../schemas/postSchemas");
const {
  createPost,
  getPosts,
  deletePost,
  likePost,
  getPostById,
} = require("../controllers/postController");

const router = express.Router();

// ✅ FIXED: Create post with denormalized data and validation
// ✅ FIXED: Create post with denormalized data and validation
const upload = require("../middleware/upload"); // Import upload middleware

router.post(
  "/create-post",
  authenticateToken,
  upload.single("image"), // Handle single image upload
  validate(createPostSchema),
  createPost,
);

// ✅ FIXED: Get posts (no need to populate if denormalized)
router.get("/posts", authenticateToken, getPosts);

router.get("/posts/:postId", authenticateToken, getPostById);

// ✅ NEW: Delete post endpoint with validation
router.delete(
  "/posts/:postId",
  authenticateToken,
  validate(postIdParamSchema),
  deletePost,
);

router.post(
  "/posts/:postId/like",
  authenticateToken,
  validate(postIdParamSchema),
  likePost,
);

module.exports = router;
