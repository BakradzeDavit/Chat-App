const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    isGroup: {
      type: Boolean,
      default: false,
    },

    groupName: {
      type: String,
      // Only required if isGroup is true
    },

    groupImage: {
      type: String,
    },

    lastMessage: {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: String,
      timestamp: Date,
    },

    // IMPORTANT: Don't store messages in the chat document
    // Store them in a separate Message collection for better performance
    // Keeping messages here will make the document grow infinitely

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }, // Adds createdAt and updatedAt automatically
);

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ "lastMessage.timestamp": -1 });

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
