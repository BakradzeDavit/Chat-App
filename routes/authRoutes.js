const express = require("express");
const { login, createUser } = require("../controllers/authController");

const router = express.Router();

// ✅ Login endpoint
router.post("/login", login);

// ✅ Create user endpoint
router.post("/create-user", createUser);

module.exports = router;
