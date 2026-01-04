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
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
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
    res.status(200).json({ message: "Username updated", user: updatedUser });
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
    const transformedPosts = posts.map((post) => ({
      id: post._id.toString(),
      text: post.text,
      author: post.author.toString(),
      displayName: post.displayName || "Unknown User",
      profileImage: post.profileImage || "letter",
      // ✅ Ensure likes are always strings
      likes: (post.likes || []).map((id) => {
        if (typeof id === "object" && id._id) {
          return id._id.toString();
        }
        return id.toString();
      }),
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      createdAt: post.createdAt,
    }));

    res.json({ posts: transformedPosts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Error fetching posts" });
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

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(userId);
      post.likesCount += 1;
    }

    await post.save();

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
