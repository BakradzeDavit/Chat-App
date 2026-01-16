const mongoose = require("mongoose");
const userModel = require("../models/user");
const PostModel = require("../models/Post");

// ✅ FIXED: Create post with denormalized data
const createPost = async (req, res) => {
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
};

// ✅ FIXED: Get posts (no need to populate if denormalized)
const getPosts = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate({
        path: "comments",
        populate: { path: "author", select: "displayName profileImage" },
      })
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

          commentsCount: post.comments ? post.comments.length : 0,
          comments: post.comments || [],
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
};

// ✅ NEW: Delete post endpoint
const deletePost = async (req, res) => {
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
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    console.log("Liking post:", postId, "by user:", userId);

    const post = await PostModel.findById(postId);
    console.log("Post found:", !!post);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.some((id) => id.toString() === userId);
    console.log("Is liked:", isLiked);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(new mongoose.Types.ObjectId(userId));
      post.likesCount += 1;
      console.log("Attempting to add notification to author:", post.author);
      try {
        const author = await userModel.findById(post.author);
        console.log("Author found:", !!author);
        if (author) {
          const alreadyExists = author.Notifications.some(
            (n) =>
              n.type === "postLike" &&
              n.sender &&
              n.sender.toString() === userId.toString() &&
              n.post &&
              n.post.toString() === post._id.toString()
          );

          if (!alreadyExists) {
            console.log("Pushing new notification with sender:", userId);
            author.Notifications.push({
              type: "postLike",
              sender:
                typeof userId === "string"
                  ? new mongoose.Types.ObjectId(userId)
                  : userId,
              post: post._id,
            });

            await author.save();
            console.log("Notification saved to author");
            
            // Emit socket event for new notification with full notification data
            if (req.io) {
              // Get the last notification (the one we just added)
              const lastNotification = author.Notifications[author.Notifications.length - 1];
              
              req.io.to(`user_${post.author.toString()}`).emit("newNotification", {
                _id: lastNotification._id,
                type: "postLike",
                sender: {
                  _id: userId,
                  displayName: await (await require("../models/user").findById(userId)).displayName,
                  profileImage: await (await require("../models/user").findById(userId)).profileImage,
                },
                post: post._id,
                createdAt: lastNotification.createdAt,
                Read: false,
              });
              console.log("Emitted newNotification socket event");
            }
          } else {
            console.log("Notification already exists");
          }
        } else {
          console.log("Author not found");
        }
      } catch (notifErr) {
        console.error("Error adding notification:", notifErr);
      }
    }

    await post.save();
    console.log("Post saved successfully");

    // Emit socket event for real-time update (only when liking, not unliking)
    if (!isLiked && req.io) {
      req.io.to(`user_${post.author.toString()}`).emit("postLiked", {
        postId: post._id.toString(),
        likerId: userId,
        likesCount: post.likesCount,
        likes: post.likes.map((id) => id.toString()),
      });
    }

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
};

module.exports = { createPost, getPosts, deletePost, likePost };
