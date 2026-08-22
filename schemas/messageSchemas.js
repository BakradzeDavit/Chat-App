const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
});

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
    attachments: z.array(attachmentSchema).optional(),
    replyTo: objectIdSchema.optional(),
  }),
});

const messageIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const chatIdParamSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),
});
const reactMessageSchema = z.object({
  chatId: objectIdSchema,
  messageId: objectIdSchema,
  emoji: z.string().min(1).max(20),
});

module.exports = {
  createMessageSchema,
  messageIdParamSchema,
  chatIdParamSchema,
  reactMessageSchema,
};
