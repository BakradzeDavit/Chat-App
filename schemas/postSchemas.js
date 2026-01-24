const { z } = require("zod");

// ✅ Helper to validate MongoDB ObjectIDs
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ✅ Create post schema
const createPostSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, "Post text cannot be empty")
      .max(5000, "Post text must be less than 5000 characters")
      .trim(),
  }),
});

// ✅ Post ID parameter schema (for like, delete)
const postIdParamSchema = z.object({
  params: z.object({
    postId: objectIdSchema,
  }),
});

module.exports = {
  createPostSchema,
  postIdParamSchema,
};
