import { z } from "zod";

/**
 * Task execution status enum.
 */
export const TaskStatusSchema = z.enum([
  "started",
  "thinking",
  "generating",
  "updating_canvas",
  "completed",
  "error",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * Shared AI status feed message schema.
 * Supports an optional text field, status state, step indicator, and timestamp.
 */
export const StatusFeedMessageSchema = z.object({
  text: z.string().optional(),
  status: TaskStatusSchema.optional(),
  step: z.string().optional(),
  timestamp: z.number().optional(),
  error: z.string().optional(),
});
export type StatusFeedMessage = z.infer<typeof StatusFeedMessageSchema>;

/**
 * Validate incoming status feed messages safely.
 */
export function validateStatusFeedMessage(
  data: unknown
): StatusFeedMessage | null {
  const result = StatusFeedMessageSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

/**
 * Chat feed message schema for room-scoped collaborative AI sidebar chat.
 */
export const ChatRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatFeedMessageSchema = z.object({
  id: z.string().optional(),
  sender: z.string(),
  role: ChatRoleSchema,
  content: z.string(),
  timestamp: z.number(),
});
export type ChatFeedMessage = z.infer<typeof ChatFeedMessageSchema>;

/**
 * Validate incoming chat feed messages safely.
 */
export function validateChatFeedMessage(data: unknown): ChatFeedMessage | null {
  const result = ChatFeedMessageSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}
