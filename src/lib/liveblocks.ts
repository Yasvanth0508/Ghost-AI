import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

const rawSecret = process.env.LIVEBLOCKS_SECRET_KEY || "";
const sanitizedSecret = rawSecret.replace(/^["'\s]+|["'\s]+$/g, "").trim();

const secretKey =
  sanitizedSecret && sanitizedSecret.startsWith("sk_")
    ? sanitizedSecret
    : "sk_dev_placeholder_secret_key";

export const liveblocks =
  globalForLiveblocks.liveblocks ??
  new Liveblocks({
    secret: secretKey,
  });

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}

export const USER_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#14B8A6", // Teal
] as const;

/**
 * Deterministically maps a user ID string to a consistent color from a fixed palette.
 */
export function getUserColor(userId: string): string {
  if (!userId) {
    return USER_COLORS[0];
  }
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
