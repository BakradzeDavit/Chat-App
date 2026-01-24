const express = require("express");
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  updateUsernameSchema,
  userIdParamSchema,
  deleteNotificationSchema,
} = require("../schemas/userSchemas");
const {
  updateUsername,
  uploadProfilePic,
  getUserProfile,
  getUserPosts,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequestsReceived,
  getFriendRequestsSent,
  removeFriend,
  getUsers,
  deleteNotification,
} = require("../controllers/userController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ Update username with validation
router.put(
  "/update-username",
  authenticateToken,
  validate(updateUsernameSchema),
  updateUsername,
);

// ✅ Upload profile picture
router.post(
  "/upload-profile-pic",
  authenticateToken,
  upload.single("profilePic"),
  uploadProfilePic,
);

router.get(
  "/users/:id/profile",
  authenticateToken,
  validate(userIdParamSchema),
  getUserProfile,
);

router.get(
  "/users/:id/posts",
  authenticateToken,
  validate(userIdParamSchema),
  getUserPosts,
);

router.post(
  "/users/:id/send-friend-request",
  authenticateToken,
  validate(userIdParamSchema),
  sendFriendRequest,
);

router.post(
  "/users/:id/accept-friend-request",
  authenticateToken,
  validate(userIdParamSchema),
  acceptFriendRequest,
);

router.post(
  "/users/:id/cancel-friend-request",
  authenticateToken,
  validate(userIdParamSchema),
  cancelFriendRequest,
);

router.get(
  "/users/friendRequestsReceived",
  authenticateToken,
  getFriendRequestsReceived,
);

router.get(
  "/users/friendRequestsSent",
  authenticateToken,
  getFriendRequestsSent,
);

router.post(
  "/users/:id/remove-friend",
  authenticateToken,
  validate(userIdParamSchema),
  removeFriend,
);

router.get("/users", authenticateToken, getUsers);

// ✅ Delete notification endpoint with validation
router.delete(
  "/notifications/:id",
  authenticateToken,
  validate(deleteNotificationSchema),
  deleteNotification,
);

module.exports = router;
