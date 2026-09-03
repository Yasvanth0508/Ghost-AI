import { logger, task } from "@trigger.dev/sdk";
import {
  executeDesignAgent,
  type DesignAgentResult,
} from "@/lib/design-agent-service";
import type { ChatFeedMessage } from "@/types/tasks";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
  projectId: string;
  userId?: string;
  chatHistory?: ChatFeedMessage[];
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload): Promise<DesignAgentResult> => {
    logger.info("Trigger.dev design agent task started", {
      projectId: payload.projectId,
      roomId: payload.roomId,
      userId: payload.userId,
      prompt: payload.prompt,
    });

    return await executeDesignAgent(payload);
  },
});
