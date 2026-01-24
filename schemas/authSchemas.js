const { z } = require("zod");

// ✅ Login validation schema
const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(1, "Password is required"),
  }),
});

// ✅ Create user validation schema
const createUserSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .min(1, "Email is required"),
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(50, "Display name must be less than 50 characters")
      .trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters"),
  }),
});

module.exports = {
  loginSchema,
  createUserSchema,
};
