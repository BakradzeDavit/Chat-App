const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    senderSnapshot: {
      displayName: String,
      profileImage: String,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profileImage: {
      type: String,
      default: "letter",
    },
    backgroundImage: {
      type: String,
      default: "",
    },
    PostsCount: {
      type: Number,
      default: 0,
    },
    Notifications: [
      {
        type: {
          type: String,
          enum: [
            "friendRequest",
            "postLike",
            "postComment",
            "Message",
            "follow",
          ],
          required: true,
        },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
        createdAt: { type: Date, default: Date.now },
        Read: { type: Boolean, default: false },
      },
    ],

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    friendRequestsReceived: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    Status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
