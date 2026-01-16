const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const http = require("http");
require("dotenv").config();

const app = express();

const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use(cors());
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

app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", userRoutes);
app.use("/", commentRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "Server is running! 🚀",
    endpoints: ["/login", "/create-user", "/posts", "/upload-profile-pic"],
  });
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Initialize socket handlers
require("./sockets/index")(io);
