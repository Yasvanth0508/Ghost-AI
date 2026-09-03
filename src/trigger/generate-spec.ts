import { logger, task } from "@trigger.dev/sdk";
import {
  generateTechnicalSpec,
  type SpecGenerationInput,
  type SpecGenerationResult,
} from "@/lib/spec-generation-service";

export type GenerateSpecPayload = SpecGenerationInput;

export const generateSpecTask = task({
  id: "generate-spec",
  maxDuration: 300,
  run: async (payload: GenerateSpecPayload): Promise<SpecGenerationResult> => {
    logger.info("Trigger.dev generate-spec task started", {
      projectId: payload.projectId,
      roomId: payload.roomId,
      userId: payload.userId,
      nodesCount: payload.nodes?.length || 0,
      edgesCount: payload.edges?.length || 0,
    });

    return await generateTechnicalSpec(payload);
  },
});
