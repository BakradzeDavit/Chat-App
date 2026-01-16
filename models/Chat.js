const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  isGroup: {
    type: Boolean,
    default: false,
  },

  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Chat", chatSchema);
