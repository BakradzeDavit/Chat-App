const mongoose = require("mongoose");
const CommentModel = require("../models/Comment");
const PostModel = require("../models/Post");

const addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await CommentModel.create({
      text,
      author: userId,
      post: postId,
    });

    const populatedComment = await CommentModel.findById(comment._id).populate(
      "author",
      "displayName profileImage"
    );

    post.comments.push(comment._id);
    await post.save();

    res.json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({
      message: "Error adding comment",
      error: err.message,
    });
  }
};

module.exports = { addComment };
