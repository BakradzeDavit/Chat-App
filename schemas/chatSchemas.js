const { z } = require("zod");

// ✅ Helper to validate MongoDB ObjectIDs
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ✅ Create private chat schema (1-on-1)
const createPrivateChatSchema = z.object({
  body: z.object({
    participants: z
      .array(objectIdSchema)
      .length(2, "Private chat must have exactly 2 participants"),
  }),
});

// ✅ Create group chat schema
const createGroupChatSchema = z.object({
  body: z.object({
    participants: z
      .array(objectIdSchema)
      .min(2, "Group chat must have at least 2 participants"),
    groupName: z
      .string()
      .min(1, "Group name cannot be empty")
      .max(100, "Group name must be less than 100 characters")
      .trim(),
    groupImage: z.string().url("Invalid image URL").optional(),
  }),
});

// ✅ Chat ID parameter schema (for fetching, updating, deleting chats)
const chatIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// ✅ Update group chat schema
const updateGroupChatSchema = z.object({
  body: z.object({
    groupName: z
      .string()
      .min(1, "Group name cannot be empty")
      .max(100, "Group name must be less than 100 characters")
      .trim()
      .optional(),
    groupImage: z.string().url("Invalid image URL").optional(),
  }),
});

module.exports = {
  createPrivateChatSchema,
  createGroupChatSchema,
  chatIdParamSchema,
  updateGroupChatSchema,
};
