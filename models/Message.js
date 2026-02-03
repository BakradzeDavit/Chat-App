// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      // Not required for media messages
      required: function () {
        return this.messageType === "text";
      },
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file", "voice"],
      default: "text",
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    attachments: [
      {
        url: String,
        name: String,
        size: Number,
        mimeType: String,
      },
    ],
  },
  { timestamps: true },
);

// Index for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
