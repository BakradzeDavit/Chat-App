const express = require("express");
const { login, createUser } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { loginSchema, createUserSchema } = require("../schemas/authSchemas");

const router = express.Router();

// ✅ Login endpoint with validation
router.post("/login", validate(loginSchema), login);

// ✅ Create user endpoint with validation
router.post("/create-user", validate(createUserSchema), createUser);

module.exports = router;
