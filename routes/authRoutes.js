const express = require("express");
const { loginLimiter, signupLimiter } = require("../middleware/rateLimiters");
const {
  login,
  createUser,
  getMe,
  logout,
} = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { loginSchema, createUserSchema } = require("../schemas/authSchemas");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// ✅ Login endpoint with validation
router.post("/login", loginLimiter, validate(loginSchema), login);

router.post(
  "/create-user",
  signupLimiter,
  validate(createUserSchema),
  createUser,
);
router.get("/me", authenticateToken, getMe);
router.post("/logout", logout);
module.exports = router;
