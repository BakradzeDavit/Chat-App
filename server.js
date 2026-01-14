const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const userModel = require("./models/user");
const PostModel = require("./models/Post");
const multer = require("multer");
const cloudinary = require("./config/cloudinary");
const user = require("./models/user");

require("dotenv").config();

const app = express();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uri = process.env.MONGODB_URI;
const SECRET_KEY = process.env.SECRET_KEY;
const PORT = process.env.PORT || 3000;

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use(cors());
app.use(express.json());
// Add this near the top, after app.use(express.json())
app.get("/", (req, res) => {
  res.json({
    status: "Server is running! 🚀",
    endpoints: ["/login", "/create-user", "/posts", "/upload-profile-pic"],
  });
});
// ✅ Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ✅ Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    await user.populate("Notifications.sender", "displayName profileImage");

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
        friends: user.friends,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Error during login", error: err.message });
  }
});

// ✅ Create user endpoint
app.post("/create-user", async (req, res) => {
  const { email, displayName, password } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await userModel.create({ email, displayName, password });

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "48h",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
        PostsCount: user.PostsCount,
        friends: user.friends,
        Notifications: user.Notifications,
      },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
});

// ✅ Update username
app.put("/update-username", authenticateToken, async (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;
  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { displayName: username },
      { new: true }
    );
    await PostModel.updateMany({ author: userId }, { displayName: username });
    res.status(200).json({
      message: "Username updated",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (err) {
    console.error("Error updating username:", err);
    res
      .status(500)
      .json({ message: "Error updating username", error: err.message });
  }
});

// ✅ FIXED: Create post with denormalized data
app.post("/create-post", authenticateToken, async (req, res) => {
  const { text } = req.body;
  try {
    // ✅ Get user info first
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Create post with denormalized fields
    const post = await PostModel.create({
      text,
      author: req.user.id,
      displayName: user.displayName,
      profileImage: user.profileImage || "letter",
    });
    await userModel.findByIdAndUpdate(post.author, {
      $inc: { PostsCount: 1 },
    });
    // ✅ Return post with all needed fields
    res.status(201).json({
      message: "Post created successfully",
      post: {
        id: post._id,
        text: post.text,
        author: post.author,
        displayName: post.displayName,
        profileImage: post.profileImage,
        likes: post.likes,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
      },
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return res.status(500).json({
      message: "Error creating post",
      error: err.message,
    });
  }
});

// ✅ FIXED: Get posts (no need to populate if denormalized)
app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await PostModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(); // Convert to plain objects for better performance

    // ✅ Transform to match frontend expectations
    const transformedPosts = posts.map((post) => {
      try {
        return {
          id: post._id.toString(),
          text: post.text || "",
          author: post.author ? post.author.toString() : "",
          displayName: post.displayName || "Unknown User",
          profileImage: post.profileImage || "letter",
          // ✅ Safely handle likes array
          likes: Array.isArray(post.likes)
            ? post.likes
                .map((id) => {
                  try {
                    if (!id) return null;
                    if (typeof id === "object" && id._id) {
                      return id._id.toString();
                    }
                    return id.toString();
                  } catch (e) {
                    console.error("Error converting like ID:", e);
                    return null;
                  }
                })
                .filter(Boolean)
            : [],
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          createdAt: post.createdAt || new Date(),
        };
      } catch (postError) {
        console.error("Error transforming post:", postError, post);
        // Return a minimal valid post object
        return {
          id: post._id ? post._id.toString() : "unknown",
          text: "Error loading post",
          author: "",
          displayName: "Unknown User",
          profileImage: "letter",
          likes: [],
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date(),
        };
      }
    });

    res.json({ posts: transformedPosts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({
      message: "Error fetching posts",
      error: err.message,
    });
  }
});

// ✅ NEW: Delete post endpoint
app.delete("/posts/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ Only author can delete
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await userModel.findByIdAndUpdate(post.author, {
      $inc: { PostsCount: -1 },
    });
    await PostModel.findByIdAndDelete(postId);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res
      .status(500)
      .json({ message: "Error deleting post", error: err.message });
  }
});
app.post("/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    console.log("Liking post:", postId, "by user:", userId);

    const post = await PostModel.findById(postId);
    console.log("Post found:", !!post);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);
    console.log("Is liked:", isLiked);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(userId);
      post.likesCount += 1;
      console.log("Attempting to add notification to author:", post.author);
      try {
        const author = await userModel.findById(post.author);
        console.log("Author found:", !!author);
        if (author) {
          const alreadyExists = author.Notifications.some(
            (n) =>
              n.type === "postLike" &&
              n.sender.toString() === userId.toString() &&
              n.post.toString() === post._id.toString()
          );

          if (!alreadyExists) {
            author.Notifications.push({
              type: "postLike",
              senderId: userId,
              Sender: req.user,
              post: post._id,
            });

            await author.save();
          }

          await author.save();
          console.log("Notification added successfully");
        } else {
          console.log("Author not found for notification");
        }
      } catch (notifErr) {
        console.error("Error adding notification:", notifErr);
      }
    }

    await post.save();
    console.log("Post saved successfully");

    res.json({
      message: isLiked ? "Post unliked" : "Post liked",
      likesCount: post.likesCount,
      isLiked: !isLiked,
      // ✅ Send back the likes array as strings
      likes: post.likes.map((id) => id.toString()),
    });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: "Error liking post", error: err.message });
  }
});
// ✅ Upload profile picture
app.post(
  "/upload-profile-pic",
  authenticateToken,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "profile_pictures" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const user = await userModel.findByIdAndUpdate(
        req.user.id,
        { profileImage: result.secure_url },
        { new: true }
      );
      await PostModel.updateMany(
        { author: req.user.id },
        { profileImage: result.secure_url }
      );
      res.json({
        message: "Profile picture uploaded successfully",
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          profileImage: user.profileImage,
        },
      });
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      res.status(500).json({
        message: "Error uploading profile picture",
        error: err.message,
      });
    }
  }
);
app.get("/users/:id/profile", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await userModel
      .findById(id)
      .select(
        "displayName email profileImage backgroundImage PostsCount friends Notifications"
      )
      .populate("Notifications.sender", "displayName profileImage");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch current user to check friend status
    const currentUser = await userModel.findById(req.user.id);
    const isFriend = currentUser.friends.some(
      (friendId) => friendId.toString() === id
    );
    const hasSentRequest = currentUser.friendRequestsSent.some(
      (reqId) => reqId.toString() === id
    );
    const hasReceivedRequest = currentUser.friendRequestsReceived.some(
      (reqId) => reqId.toString() === id
    );

    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage,
        PostsCount: user.PostsCount,
        friends: user.friends,
        isFriend,
        hasSentRequest,
        hasReceivedRequest,
        Notifications: user.Notifications,
      },
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      message: "Error fetching user",
      error: err.message,
    });
  }
});

app.post(
  "/users/:id/send-friend-request",
  authenticateToken,
  async (req, res) => {
    try {
      const { id: targetUserId } = req.params;
      const senderId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (targetUserId === senderId) {
        return res
          .status(400)
          .json({ message: "Cannot send friend request to yourself" });
      }
      targetUserId.no;
      const sender = await userModel.findById(senderId);
      const target = await userModel.findById(targetUserId);

      if (!target) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already friends
      if (sender.friends.includes(targetUserId)) {
        return res.status(400).json({ message: "Already friends" });
      }

      // Check if request already sent
      if (sender.friendRequestsSent.includes(targetUserId)) {
        return res.status(400).json({ message: "Friend request already sent" });
      }

      // Check if request already received (though unlikely)
      if (target.friendRequestsReceived.includes(senderId)) {
        return res
          .status(400)
          .json({ message: "Friend request already exists" });
      }

      // Add to sent and received
      sender.friendRequestsSent.push(targetUserId);
      target.friendRequestsReceived.push(senderId);

      // Check if notification already exists
      const notificationExists = target.Notifications.some(
        (n) =>
          n.type === "friendRequest" &&
          n.sender.toString() === sender._id.toString()
      );

      if (!notificationExists) {
        target.Notifications.push({
          type: "friendRequest",
          sender: sender._id,
          sender: sender,
        });
      }

      await sender.save();
      await target.save();

      res.json({ message: "Friend request sent successfully" });
    } catch (err) {
      console.error("Error sending friend request:", err);
      res.status(500).json({
        message: "Error sending friend request",
        error: err.message,
      });
    }
  }
);

app.post(
  "/users/:id/accept-friend-request",
  authenticateToken,
  async (req, res) => {
    try {
      const { id: senderId } = req.params;
      const receiverId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const receiver = await userModel.findById(receiverId);
      const sender = await userModel.findById(senderId);

      if (!sender) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if request exists
      if (!receiver.friendRequestsReceived.includes(senderId)) {
        return res
          .status(400)
          .json({ message: "No friend request from this user" });
      }

      // Add to friends
      receiver.friends.push(senderId);
      sender.friends.push(receiverId);

      // Remove from requests
      receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(
        (id) => id.toString() !== senderId
      );
      sender.friendRequestsSent = sender.friendRequestsSent.filter(
        (id) => id.toString() !== receiverId
      );

      // Remove notification
      receiver.Notifications = receiver.Notifications.filter(
        (n) =>
          !(
            n.type === "friendRequest" &&
            n.sender.toString() === sender._id.toString()
          )
      );

      await receiver.save();
      await sender.save();

      res.json({ message: "Friend request accepted successfully" });
    } catch (err) {
      console.error("Error accepting friend request:", err);
      res.status(500).json({
        message: "Error accepting friend request",
        error: err.message,
      });
    }
  }
);

app.post(
  "/users/:id/cancel-friend-request",
  authenticateToken,
  async (req, res) => {
    try {
      const { id: targetUserId } = req.params;
      const senderId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const sender = await userModel.findById(senderId);
      const target = await userModel.findById(targetUserId);

      if (!target) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove from sent and received
      sender.friendRequestsSent = sender.friendRequestsSent.filter(
        (id) => id.toString() !== targetUserId
      );
      target.friendRequestsReceived = target.friendRequestsReceived.filter(
        (id) => id.toString() !== senderId
      );

      // Remove notification from target
      target.Notifications = target.Notifications.filter(
        (n) =>
          !(
            n.type === "friendRequest" &&
            n.sender.toString() === sender._id.toString()
          )
      );

      await sender.save();
      await target.save();

      res.json({ message: "Friend request canceled successfully" });
    } catch (err) {
      console.error("Error canceling friend request:", err);
      res.status(500).json({
        message: "Error canceling friend request",
        error: err.message,
      });
    }
  }
);

app.get(
  "/users/friendRequestsReceived",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await userModel
        .findById(userId)
        .populate("friendRequestsReceived", "displayName email profileImage");
      res.json({ friendRequests: user.friendRequestsReceived });
    } catch (err) {
      console.error("Error fetching friend requests received:", err);
      res.status(500).json({
        message: "Error fetching friend requests received",
        error: err.message,
      });
    }
  }
);

app.get("/users/friendRequestsSent", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel
      .findById(userId)
      .populate("friendRequestsSent", "displayName email profileImage");
    res.json({ friendRequests: user.friendRequestsSent });
  } catch (err) {
    console.error("Error fetching friend requests sent:", err);
    res.status(500).json({
      message: "Error fetching friend requests sent",
      error: err.message,
    });
  }
});

app.post("/users/:id/remove-friend", authenticateToken, async (req, res) => {
  try {
    const { id: friendId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await userModel.findById(userId);
    const friend = await userModel.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from both friends arrays
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error("Error removing friend:", err);
    res.status(500).json({
      message: "Error removing friend",
      error: err.message,
    });
  }
});

app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await userModel.find(
      { _id: { $ne: req.user.id } },
      "displayName profileImage _id" // only safe fields
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
