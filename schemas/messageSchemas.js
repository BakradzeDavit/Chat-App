const { z } = require("zod");

// ✅ Helper to validate MongoDB ObjectIDs
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ✅ Create message schema
const createMessageSchema = z.object({
  body: z.object({
    chatId: objectIdSchema,
    content: z
      .string()
      .min(1, "Message content cannot be empty")
      .max(5000, "Message content must be less than 5000 characters")
      .trim(),
    messageType: z
      .enum(["text", "image", "file", "voice"])
      .optional()
      .default("text"),
  }),
});

// ✅ Message ID parameter schema (for delete, update, etc.)
const messageIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// ✅ Chat ID parameter schema (for fetching messages by chat)
const chatIdParamSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),
});

module.exports = {
  createMessageSchema,
  messageIdParamSchema,
  chatIdParamSchema,
};
