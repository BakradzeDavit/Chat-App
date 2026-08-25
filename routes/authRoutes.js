const express = require("express");
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
router.post("/login", validate(loginSchema), login);

// ✅ Create user endpoint with validation
router.post("/create-user", validate(createUserSchema), createUser);

router.get("/me", authenticateToken, getMe);
router.post("/logout", logout);
module.exports = router;
