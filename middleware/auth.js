const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const dbUser = await userModel.findById(decoded.id);

    if (!dbUser) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    console.error("Error during token verification:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = { authenticateToken };
