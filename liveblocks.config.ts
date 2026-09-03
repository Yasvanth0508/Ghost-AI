// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Real-time cursor coordinates
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: Record<string, never>;

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent:
      | {
          type: "ai-status";
          data: {
            text?: string;
            status?:
              | "started"
              | "thinking"
              | "generating"
              | "updating_canvas"
              | "completed"
              | "error";
            step?: string;
            timestamp?: number;
            error?: string;
          };
        }
      | {
          type: "ai-chat";
          data: {
            id?: string;
            sender: string;
            role: "user" | "assistant" | "system";
            content: string;
            timestamp: number;
          };
        };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
  }
}

export {};
