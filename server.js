const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const http = require("http");
const User = require("./models/user");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const app = express();
app.use(cookieParser());

const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup FIRST
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ✅ CRITICAL: Middleware MUST be added BEFORE routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes - loaded AFTER middleware
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", userRoutes);
app.use("/", commentRoutes);
app.use("/chats", chatRoutes);
app.use("/messages", messageRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "Server is running! 🚀",
    endpoints: [
      "/login",
      "/create-user",
      "/posts",
      "/upload-profile-pic",
      "/chats",
      "/messages",
    ],
  });
});

// Initialize socket handlers
require("./sockets/index")(io);

const startServer = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    // Presence is connection-derived, so old values cannot survive a restart.
    await User.updateMany(
      { Status: "online" },
      { $set: { Status: "offline" } },
    );

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  }
};

startServer();
