const { z } = require("zod");

// ✅ Helper to validate MongoDB ObjectIDs
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ✅ Update username schema
const updateUsernameSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(2, "Username must be at least 2 characters")
      .max(50, "Username must be less than 50 characters")
      .trim(),
  }),
});

// ✅ User ID parameter schema (for friend requests, etc.)
const userIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// ✅ Delete notification schema
const deleteNotificationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

module.exports = {
  updateUsernameSchema,
  userIdParamSchema,
  deleteNotificationSchema,
};
