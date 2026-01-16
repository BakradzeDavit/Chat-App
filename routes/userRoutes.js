const express = require("express");
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");
const {
  updateUsername,
  uploadProfilePic,
  getUserProfile,
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

// ✅ Update username
router.put("/update-username", authenticateToken, updateUsername);

// ✅ Upload profile picture
router.post(
  "/upload-profile-pic",
  authenticateToken,
  upload.single("profilePic"),
  uploadProfilePic
);

router.get("/users/:id/profile", authenticateToken, getUserProfile);

router.post(
  "/users/:id/send-friend-request",
  authenticateToken,
  sendFriendRequest
);

router.post(
  "/users/:id/accept-friend-request",
  authenticateToken,
  acceptFriendRequest
);

router.post(
  "/users/:id/cancel-friend-request",
  authenticateToken,
  cancelFriendRequest
);

router.get(
  "/users/friendRequestsReceived",
  authenticateToken,
  getFriendRequestsReceived
);

router.get(
  "/users/friendRequestsSent",
  authenticateToken,
  getFriendRequestsSent
);

router.post("/users/:id/remove-friend", authenticateToken, removeFriend);

router.get("/users", authenticateToken, getUsers);

// ✅ Delete notification endpoint
router.delete("/notifications/:id", authenticateToken, deleteNotification);

module.exports = router;
