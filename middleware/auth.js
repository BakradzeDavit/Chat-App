const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

// ✅ Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
