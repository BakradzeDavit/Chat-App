const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

const SECRET_KEY = process.env.SECRET_KEY;

// ✅ Login endpoint
const login = async (req, res) => {
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
};

// ✅ Create user endpoint
const createUser = async (req, res) => {
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
};

module.exports = { login, createUser };
