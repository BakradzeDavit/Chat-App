const { z } = require("zod");

// ✅ Helper to validate MongoDB ObjectIDs
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ✅ Add comment schema
const addCommentSchema = z.object({
  body: z.object({
    postId: objectIdSchema,
    text: z
      .string()
      .min(1, "Comment text cannot be empty")
      .max(2000, "Comment text must be less than 2000 characters")
      .trim(),
  }),
});

module.exports = {
  addCommentSchema,
};
