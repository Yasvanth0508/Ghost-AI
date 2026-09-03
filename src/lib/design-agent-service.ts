import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { MarkerType } from "@xyflow/react";
import { liveblocks } from "@/lib/liveblocks";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  SHAPE_DEFINITIONS,
  NODE_COLORS,
  DEFAULT_NODE_COLOR,
  type CanvasNodeShape,
  type CanvasNode,
  type CanvasEdge,
} from "@/types/canvas";
import type { TaskStatus, ChatFeedMessage } from "@/types/tasks";
import { prisma } from "@/lib/prisma";

export interface DesignAgentInput {
  prompt: string;
  roomId: string;
  projectId: string;
  userId?: string;
  chatHistory?: ChatFeedMessage[];
}

export interface DesignAgentResult {
  success: boolean;
  summary?: string;
  nodesAdded?: number;
  edgesAdded?: number;
  error?: string;
  timestamp: string;
}

/**
 * Computes dynamic node dimensions based on shape geometry and label sentence length
 * to ensure all component titles are fully visible without truncation.
 */
export function computeDynamicNodeSize(
  shape: CanvasNodeShape,
  label: string,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  const shapeDef = SHAPE_DEFINITIONS[shape] || SHAPE_DEFINITIONS.rectangle;
  const textLength = (label || "").trim().length;

  if (customWidth && customHeight) {
    return {
      width: Math.max(shapeDef.defaultWidth, customWidth),
      height: Math.max(shapeDef.defaultHeight, customHeight),
    };
  }

  switch (shape) {
    case "rectangle": {
      const width = Math.max(160, Math.min(260, textLength * 8.5 + 40));
      const height = Math.max(72, Math.ceil(textLength / 18) * 22 + 32);
      return {
        width: customWidth ?? width,
        height: customHeight ?? height,
      };
    }
    case "pill": {
      const width = Math.max(160, Math.min(260, textLength * 9 + 44));
      const height = Math.max(56, 44 + Math.ceil(textLength / 16) * 14);
      return {
        width: customWidth ?? width,
        height: customHeight ?? height,
      };
    }
    case "diamond": {
      const dim = Math.max(130, Math.min(180, textLength * 8.5 + 50));
      return {
        width: customWidth ?? dim,
        height: customHeight ?? dim,
      };
    }
    case "cylinder": {
      const width = Math.max(140, Math.min(230, textLength * 8.5 + 40));
      const height = Math.max(90, 80 + Math.ceil(textLength / 16) * 16);
      return {
        width: customWidth ?? width,
        height: customHeight ?? height,
      };
    }
    case "hexagon": {
      const width = Math.max(140, Math.min(240, textLength * 9 + 48));
      const height = Math.max(90, 75 + Math.ceil(textLength / 16) * 18);
      return {
        width: customWidth ?? width,
        height: customHeight ?? height,
      };
    }
    case "circle": {
      const dim = Math.max(100, Math.min(150, textLength * 8 + 40));
      return {
        width: customWidth ?? dim,
        height: customHeight ?? dim,
      };
    }
    default: {
      const width = Math.max(160, Math.min(260, textLength * 8.5 + 40));
      const height = Math.max(72, Math.ceil(textLength / 18) * 22 + 32);
      return { width, height };
    }
  }
}

const DesignActionSchema = z.object({
  summary: z
    .string()
    .describe(
      "A concise 1-2 sentence explanation of the system architecture design decisions and end-to-end topology flow."
    ),
  nodesToAdd: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            "Unique identifier for the node (e.g. 'client-app', 'api-gateway', 'chatbot-engine', 'emotion-classifier', 'postgres-db')"
          ),
        shape: z
          .enum([
            "rectangle",
            "diamond",
            "circle",
            "pill",
            "cylinder",
            "hexagon",
          ])
          .describe(
            "Node shape: rectangle (standard service/module/engine), cylinder (database/cache/storage), diamond (gateway/router), circle (user/actor/client), pill (broker/queue), hexagon (AI/ML worker/external API)"
          ),
        label: z
          .string()
          .describe(
            "Descriptive human-readable component label (e.g. 'Emotional Chatbot Engine', 'Emotion Classifier Service', 'PostgreSQL (Users & Profiles)')"
          ),
        color: z
          .enum([
            "neutral",
            "blue",
            "purple",
            "orange",
            "red",
            "pink",
            "green",
            "teal",
          ])
          .default("neutral")
          .describe("Color theme from the curated palette"),
        position: z.object({
          x: z.number().describe("X coordinate on canvas"),
          y: z.number().describe("Y coordinate on canvas"),
        }),
        width: z.number().optional().describe("Optional custom width"),
        height: z.number().optional().describe("Optional custom height"),
      })
    )
    .default([])
    .describe("Nodes/modules to add to the canvas"),
  nodesToUpdate: z
    .array(
      z.object({
        id: z.string().describe("ID of the existing node to update"),
        label: z.string().optional().describe("Updated label"),
        color: z
          .enum([
            "neutral",
            "blue",
            "purple",
            "orange",
            "red",
            "pink",
            "green",
            "teal",
          ])
          .optional()
          .describe("Updated color"),
        shape: z
          .enum([
            "rectangle",
            "diamond",
            "circle",
            "pill",
            "cylinder",
            "hexagon",
          ])
          .optional()
          .describe("Updated shape"),
        position: z
          .object({ x: z.number(), y: z.number() })
          .optional()
          .describe("Updated position"),
        width: z.number().optional().describe("Updated width"),
        height: z.number().optional().describe("Updated height"),
      })
    )
    .default([])
    .describe("Existing nodes to move, resize, or rename"),
  nodeIdsToDelete: z
    .array(z.string())
    .default([])
    .describe("IDs of existing nodes to remove"),
  edgesToAdd: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            "Unique edge ID (e.g. 'edge-client-gw', 'edge-gw-chatbot', 'edge-chatbot-classifier', 'edge-classifier-broker')"
          ),
        source: z
          .string()
          .describe(
            "Source node ID (must match an existing node ID or one from nodesToAdd)"
          ),
        target: z
          .string()
          .describe(
            "Target node ID (must match an existing node ID or one from nodesToAdd)"
          ),
        sourceHandle: z
          .enum(["top", "right", "bottom", "left"])
          .optional()
          .describe(
            "Optional source handle: use 'bottom' for downward flow, 'right' for horizontal flow"
          ),
        targetHandle: z
          .enum(["top", "right", "bottom", "left"])
          .optional()
          .describe(
            "Optional target handle: use 'top' for downward flow, 'left' for horizontal flow"
          ),
        label: z
          .string()
          .optional()
          .describe(
            "Protocol or connection label (e.g. 'HTTPS', 'gRPC', 'REST', 'SQL', 'Pub/Sub', 'Kafka Event', 'Redis Cache', 'WebSocket')"
          ),
      })
    )
    .default([])
    .describe(
      "Directed edges/connections linking modules together into ONE SINGLE unified end-to-end flow."
    ),
  edgeIdsToDelete: z
    .array(z.string())
    .default([])
    .describe("IDs of edges to remove"),
});

const SYSTEM_PROMPT = `You are Ghost AI, an expert system architect and infrastructure designer.
Your mission is to translate user requirements into a professional, highly legible, well-structured, and 100% UNIFIED, FULLY CONNECTED system design diagram on a collaborative canvas.

### Layout & Spacing Rules:
1. Arrange components in clear architectural tiers (top-to-bottom flow):
   - Tier 1 (Clients / Ingress): y = 100 -> Client Apps, Mobile/Web, CDN, DNS (circle, pill, rectangle) [blue/neutral]
   - Tier 2 (Gateway / Routing): y = 250 -> API Gateway, Reverse Proxy, Load Balancer (diamond, rectangle) [blue/green]
   - Tier 3 (Core Services & Microservices): y = 420 -> Backend Engines, Auth, Classifiers, Domain Services (rectangle, hexagon) [green/neutral/purple]
   - Tier 4 (Async Processing, Caching & Event Brokers): y = 590 -> Message Queues, Kafka/Event Bus, Redis Cache, Background Workers (pill, hexagon, cylinder) [orange/purple]
   - Tier 5 (Data & Storage): y = 760 -> PostgreSQL, MySQL, Vector DB, MongoDB, Analytics DB, S3/Blob (cylinder) [teal]
2. Horizontal Spacing:
   - Space sibling nodes at least 260px apart horizontally (e.g. x = 100, x = 380, x = 660, x = 940, x = 1220) to ensure wide, readable nodes with descriptive labels never overlap.
   - Center tiers relative to each other for clean visual hierarchy.

### Shape Selection Guidelines (CRITICAL):
- \`rectangle\`: Primary choice for core backend engines, application microservices, and domain logic with descriptive multi-word titles (provides maximum text readability).
- \`pill\`: Message brokers, event streams, status queues, and client entrypoints.
- \`cylinder\`: ALL databases, caches, vector stores, data lakes, and analytics stores.
- \`diamond\`: API gateways, reverse proxies, and decision routers (use short, concise names like "API Gateway").
- \`circle\`: User clients, mobile apps, web actors, and IoT devices.
- \`hexagon\`: Specialized AI/ML models (e.g. Emotion Classifier, NLP Engine), external third-party APIs (e.g. Stripe, Twilio), and compute workers.

### Graph Topology & Unified Flow Rules (CRITICAL):
1. SINGLE UNIFIED CONNECTED GRAPH (NO DISCONNECTED ISLANDS):
   - The entire architecture MUST be a single, cohesive, end-to-end directed workflow graph.
   - Disconnected subgraphs, isolated islands, or orphan components with no connections to the rest of the system are STRICTLY FORBIDDEN.
   - Every single component generated in \`nodesToAdd\` MUST be wired into the main flow with incoming and/or outgoing edges in \`edgesToAdd\`.

2. End-to-End Realistic Data Flow:
   - Tier 1 (Clients) -> Tier 2 (Gateway / Load Balancer): Connect via "HTTPS", "WebSocket", or "DNS / CDN".
   - Tier 2 (Gateway) -> Tier 3 (Core Services): Route traffic to core engines (e.g. Chatbot Engine, Auth Service) via "REST", "gRPC", or "/chat".
   - Cross-Service & Domain Integrations in Tier 3:
     - The Core Engine MUST connect to auxiliary microservices or AI models (e.g. Chatbot Engine -> Emotion Classifier via "Analyze Stream" or "gRPC").
     - Core services MUST connect to shared Session/Context Caches in Tier 4 or Tier 5 via "Redis Lookup" or "Read / Write".
   - Tier 3 (Services) -> Tier 4 (Event Streaming / Async):
     - Services & Classifiers MUST publish events or push tasks to Message Brokers / Queues (e.g. Emotion Classifier -> Emotion Event Broker via "Publish Event" or "Kafka Topic").
   - Tier 4 (Brokers / Workers) -> Tier 5 (Databases / Analytics):
     - Event Brokers & Workers MUST connect down to storage sinks (e.g. Event Broker -> Vector DB / Analytics DB via "Async Ingest" or "Stream Sink").
   - Tier 3 (Services) -> Tier 5 (Primary Databases):
     - Core services MUST connect directly to their dedicated primary databases via "SQL Queries" or "ORM".
   - EVERY database/storage cylinder MUST have at least one incoming write or read connection from a service, broker, or worker.

3. Edge Routing & Directionality:
   - Edges MUST always point in the direction of the request, event, or data flow (source: caller/producer -> target: callee/consumer/storage).
   - For vertical tier-to-tier connections (top to bottom), set \`sourceHandle: "bottom"\` and \`targetHandle: "top"\`.
   - For horizontal side-by-side connections, set \`sourceHandle: "right"\` and \`targetHandle: "left"\`.
   - Always assign a clear ID to every edge (e.g. \`edge-client-gw\`, \`edge-gw-chatbot\`, \`edge-chatbot-classifier\`, \`edge-classifier-broker\`, \`edge-broker-analytics\`).

4. Collaborative Context:
   - If the canvas already contains nodes and edges, analyze them and intelligently modify, extend, or connect new modules to existing ones without destroying user work unless requested.
   - If starting from an empty canvas or asked for a complete architecture, generate a complete end-to-end topology with all nodes and all connecting edges.`;

/**
 * Broadcasts task status and presence to Liveblocks room participants.
 */
export async function notifyRoom(
  roomId: string,
  status: TaskStatus,
  text: string,
  step?: string,
  cursorPosition?: { x: number; y: number } | null
) {
  const isThinking = status !== "completed" && status !== "error";

  // 1. Update ephemeral AI Presence
  try {
    await liveblocks.setPresence(roomId, {
      userId: "ghost-ai-agent",
      data: {
        cursor: cursorPosition ?? { x: 450, y: 300 },
        thinking: isThinking,
      },
      userInfo: {
        name: "Ghost AI",
        color: "#62C073",
        avatar: "",
      },
      ttl: 60,
    });
  } catch (presenceErr) {
    console.warn("[AI_PRESENCE_WARN]", presenceErr);
  }

  // 2. Broadcast room event for realtime clients
  try {
    await liveblocks.broadcastEvent(roomId, {
      type: "ai-status",
      data: {
        text,
        status,
        step,
        timestamp: Date.now(),
      },
    });
  } catch (broadcastErr) {
    console.warn("[AI_BROADCAST_WARN]", broadcastErr);
  }

  // 3. Post message to ai-status-feed if available
  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: "ai-status-feed",
      data: {
        text,
        status,
        step,
        timestamp: Date.now(),
      },
    });
  } catch {
    // Feed might not be explicitly created in all environments; ignore gracefully
  }
}

/**
 * Executes the core design agent logic with Gemini and Liveblocks mutateFlow.
 */
export async function executeDesignAgent(
  input: DesignAgentInput
): Promise<DesignAgentResult> {
  const { prompt, roomId } = input;

  try {
    // Step 1: Start notification
    await notifyRoom(
      roomId,
      "started",
      "Analyzing system design prompt...",
      "init",
      { x: 300, y: 200 }
    );

    // Step 2: Read current canvas graph state via Liveblocks
    let existingNodes: CanvasNode[] = [];
    let existingEdges: CanvasEdge[] = [];

    try {
      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        async (flow) => {
          existingNodes = [...flow.nodes];
          existingEdges = [...flow.edges];
        }
      );
    } catch (readErr) {
      console.warn("[CANVAS_READ_WARN] Assuming empty canvas", readErr);
    }

    // Step 2.5: Retrieve and format conversation memory
    let history = input.chatHistory;
    if (!history || history.length === 0) {
      try {
        const dbMsgs = await prisma.projectMessage.findMany({
          where: { projectId: roomId },
          orderBy: { createdAt: "desc" },
          take: 12,
        });
        history = dbMsgs.reverse().map((m) => ({
          id: m.id,
          sender: m.sender,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: m.createdAt.getTime(),
        }));
      } catch (dbErr) {
        console.warn("[AGENT_MEMORY_DB_FETCH_WARN]", dbErr);
      }
    }

    const formattedHistory =
      history && history.length > 0
        ? history
            .slice(-10)
            .map((m) => `[${m.role.toUpperCase()} - ${m.sender}]: ${m.content}`)
            .join("\n")
        : "No previous conversation history (First turn).";

    // Step 3: Call Gemini AI
    await notifyRoom(
      roomId,
      "thinking",
      "Generating architecture topology with Gemini AI...",
      "analyzing",
      { x: 500, y: 350 }
    );

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "";

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const promptContext = `
CONVERSATION MEMORY (PAST TURNS):
${formattedHistory}

LATEST USER INSTRUCTION: "${prompt}"

CURRENT CANVAS STATE:
- Existing Nodes (${existingNodes.length}): ${JSON.stringify(
      existingNodes.map((n) => ({
        id: n.id,
        label: n.data?.label,
        shape: n.data?.shape,
        color: n.data?.color,
        position: n.position,
        width: n.style?.width,
        height: n.style?.height,
      }))
    )}
- Existing Edges (${existingEdges.length}): ${JSON.stringify(
      existingEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.data?.label,
      }))
    )}

CRITICAL GENERATION & CONTINUITY REQUIREMENTS:
1. STATEFUL ITERATIVE EVOLUTION:
   - Understand the context and pronouns from the Conversation Memory (e.g. "it", "the database", "the auth service we created", "change its cache to Redis").
   - If the canvas already contains nodes, DO NOT erase or rebuild the entire architecture from scratch unless explicitly requested.
   - Retain existing node IDs and positions in place.
   - Use 'nodesToUpdate' to change properties (labels, colors, shapes, positions) of existing nodes.
   - Use 'nodesToAdd' strictly for new components requested by the user, placing them in their correct architectural tier (Tiers 1-5: y = 100, 250, 420, 590, 760).
   - Use 'nodeIdsToDelete' only if the user explicitly asks to remove specific components.
2. CONNECTION INTEGRITY:
   - Retain valid existing edges.
   - Connect any newly added nodes to the existing graph so the entire canvas forms a unified, connected architecture.
   - Use 'edgesToAdd' with descriptive protocol labels (e.g. 'HTTPS', 'gRPC', 'SQL', 'Kafka Topic', 'Redis Cache').
   - Use 'edgeIdsToDelete' only when disconnecting obsolete connections.
3. SINGLE UNIFIED FLOW: Output MUST form a single, fully connected architecture graph without disconnected orphan clusters.
4. If starting from an empty canvas or generating a brand-new complete architecture, generate a full end-to-end topology with all nodes and all connecting edges.`;

    // Try configured model or modern Gemini models (gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro)
    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const candidateModels = Array.from(
      new Set(
        [
          configuredModel,
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-2.0-flash-lite",
          "gemini-1.5-pro",
        ].filter(Boolean) as string[]
      )
    );

    let result: z.infer<typeof DesignActionSchema> | undefined;
    let lastError: unknown;

    for (const modelName of candidateModels) {
      try {
        const generation = await generateObject({
          model: google(modelName),
          schema: DesignActionSchema,
          system: SYSTEM_PROMPT,
          prompt: promptContext,
        });
        result = generation.object;
        if (result) {
          break;
        }
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(
          `[GEMINI_MODEL_ATTEMPT] Model ${modelName} failed, trying next candidate...`,
          modelErr
        );
      }
    }

    if (!result) {
      throw (
        lastError ||
        new Error("All candidate Gemini models failed to generate output.")
      );
    }

    // Step 4: Apply mutations to collaborative canvas via mutateFlow
    await notifyRoom(
      roomId,
      "updating_canvas",
      "Applying architecture layout to canvas...",
      "mutating",
      result.nodesToAdd[0]?.position ?? { x: 450, y: 400 }
    );

    let totalEdgesAdded = 0;

    await mutateFlow<CanvasNode, CanvasEdge>(
      { client: liveblocks, roomId },
      async (flow) => {
        // 1. Delete requested nodes
        if (result.nodeIdsToDelete && result.nodeIdsToDelete.length > 0) {
          flow.removeNodes(result.nodeIdsToDelete);
        }

        // 2. Delete requested edges
        if (result.edgeIdsToDelete && result.edgeIdsToDelete.length > 0) {
          flow.removeEdges(result.edgeIdsToDelete);
        }

        // 3. Update existing nodes
        if (result.nodesToUpdate && result.nodesToUpdate.length > 0) {
          for (const update of result.nodesToUpdate) {
            if (update.position) {
              flow.updateNode(update.id, { position: update.position });
            }

            const existingNode = flow.nodes.find((n) => n.id === update.id);
            const targetShape =
              (update.shape as CanvasNodeShape) ||
              (existingNode?.data?.shape as CanvasNodeShape) ||
              "rectangle";
            const targetLabel =
              update.label !== undefined
                ? update.label
                : existingNode?.data?.label || "";

            const dynamicSize = computeDynamicNodeSize(
              targetShape,
              targetLabel,
              update.width,
              update.height
            );

            flow.updateNode(update.id, (old) => ({
              ...old,
              style: {
                ...old.style,
                width: dynamicSize.width,
                height: dynamicSize.height,
              },
            }));

            if (
              update.label !== undefined ||
              update.color ||
              update.shape
            ) {
              flow.updateNodeData(update.id, (oldData) => {
                const colorDef = update.color
                  ? NODE_COLORS.find((c) => c.id === update.color)
                  : undefined;
                return {
                  ...oldData,
                  ...(update.label !== undefined
                    ? { label: update.label }
                    : {}),
                  ...(update.shape ? { shape: update.shape } : {}),
                  ...(colorDef
                    ? { color: colorDef.fill, textColor: colorDef.text }
                    : {}),
                };
              });
            }
          }
        }

        // 4. Add new nodes with dynamic sizing
        if (result.nodesToAdd && result.nodesToAdd.length > 0) {
          for (const nodeData of result.nodesToAdd) {
            const shapeKey = (nodeData.shape as CanvasNodeShape) || "rectangle";
            const colorDef =
              NODE_COLORS.find((c) => c.id === nodeData.color) ||
              DEFAULT_NODE_COLOR;

            const dynamicSize = computeDynamicNodeSize(
              shapeKey,
              nodeData.label,
              nodeData.width,
              nodeData.height
            );

            const newNode: CanvasNode = {
              id: nodeData.id,
              type: CANVAS_NODE_TYPE,
              position: nodeData.position,
              data: {
                label: nodeData.label,
                color: colorDef.fill,
                textColor: colorDef.text,
                shape: shapeKey,
              },
              style: {
                width: dynamicSize.width,
                height: dynamicSize.height,
              },
            };

            flow.addNode(newNode);
          }
        }

        // 5. Build full available nodes map (existing remaining + newly added)
        const allCanvasNodes = new Map<
          string,
          {
            id: string;
            shape: string;
            label: string;
            position: { x: number; y: number };
          }
        >();

        for (const n of flow.nodes) {
          allCanvasNodes.set(n.id, {
            id: n.id,
            shape: (n.data?.shape as string) || "rectangle",
            label: (n.data?.label as string) || "",
            position: n.position || { x: 0, y: 0 },
          });
        }
        for (const n of result.nodesToAdd) {
          allCanvasNodes.set(n.id, {
            id: n.id,
            shape: n.shape || "rectangle",
            label: n.label || "",
            position: n.position || { x: 0, y: 0 },
          });
        }
        if (result.nodeIdsToDelete) {
          for (const id of result.nodeIdsToDelete) {
            allCanvasNodes.delete(id);
          }
        }

        const validEdges: CanvasEdge[] = [];
        const existingEdgeKeys = new Set(
          flow.edges.map((e) => `${e.source}->${e.target}`)
        );

        // Process explicit edges from Gemini
        if (result.edgesToAdd && result.edgesToAdd.length > 0) {
          for (let i = 0; i < result.edgesToAdd.length; i++) {
            const edgeData = result.edgesToAdd[i];
            const source = edgeData.source?.trim();
            const target = edgeData.target?.trim();

            if (!source || !target || source === target) continue;
            if (!allCanvasNodes.has(source) || !allCanvasNodes.has(target))
              continue;

            const edgeKey = `${source}->${target}`;
            if (existingEdgeKeys.has(edgeKey)) continue;
            existingEdgeKeys.add(edgeKey);

            const edgeId =
              edgeData.id && edgeData.id.trim()
                ? edgeData.id.trim()
                : `edge-${source}-${target}-${Date.now()}-${i}`;

            const newEdge: CanvasEdge = {
              id: edgeId,
              type: CANVAS_EDGE_TYPE,
              source,
              target,
              sourceHandle: edgeData.sourceHandle || "bottom",
              targetHandle: edgeData.targetHandle || "top",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#94a3b8",
              },
              data: {
                label: edgeData.label?.trim() || undefined,
              },
            };

            validEdges.push(newEdge);
          }
        }

        // 6. Connected Component Analysis & Graph Island Bridge Guarantee
        const nodeList = Array.from(allCanvasNodes.values());
        if (nodeList.length >= 2) {
          // Build undirected adjacency graph across all existing + new edges
          const adj = new Map<string, Set<string>>();
          for (const node of nodeList) {
            adj.set(node.id, new Set<string>());
          }

          const registerAdjEdge = (s: string, t: string) => {
            if (adj.has(s) && adj.has(t)) {
              adj.get(s)!.add(t);
              adj.get(t)!.add(s);
            }
          };

          for (const e of flow.edges) {
            registerAdjEdge(e.source, e.target);
          }
          for (const e of validEdges) {
            registerAdjEdge(e.source, e.target);
          }

          // Find connected components
          const visited = new Set<string>();
          const components: Array<
            Array<{
              id: string;
              shape: string;
              label: string;
              position: { x: number; y: number };
            }>
          > = [];

          for (const node of nodeList) {
            if (!visited.has(node.id)) {
              const comp: typeof nodeList = [];
              const queue = [node.id];
              visited.add(node.id);

              while (queue.length > 0) {
                const currId = queue.shift()!;
                const currNode = allCanvasNodes.get(currId);
                if (currNode) comp.push(currNode);

                const neighbors = adj.get(currId) || new Set();
                for (const neighborId of neighbors) {
                  if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                  }
                }
              }

              // Sort nodes in component by Y position (top-to-bottom)
              comp.sort((a, b) => a.position.y - b.position.y);
              components.push(comp);
            }
          }

          // Sort components by top-most node Y coordinate so Component 0 is primary ingress/top tier
          components.sort(
            (a, b) => (a[0]?.position.y ?? 0) - (b[0]?.position.y ?? 0)
          );

          // If more than 1 disconnected component exists, automatically bridge them
          if (components.length > 1) {
            const primaryComp = components[0];

            for (let c = 1; c < components.length; c++) {
              const orphanComp = components[c];
              const orphanRoot = orphanComp[0]; // Top-most node in disconnected island

              // Find best upstream source in primary component
              // Prefer core services (Tier 3: y ~ 420 or rectangle) or gateway (Tier 2: y ~ 250)
              let bestSource = primaryComp.find(
                (n) =>
                  n.position.y <= orphanRoot.position.y &&
                  (n.shape === "rectangle" || n.shape === "diamond")
              );

              if (!bestSource) {
                bestSource = primaryComp.reduce((closest, curr) =>
                  Math.abs(curr.position.y - orphanRoot.position.y) <
                  Math.abs(closest.position.y - orphanRoot.position.y)
                    ? curr
                    : closest
                );
              }

              const edgeKey = `${bestSource.id}->${orphanRoot.id}`;
              if (
                bestSource.id !== orphanRoot.id &&
                !existingEdgeKeys.has(edgeKey)
              ) {
                existingEdgeKeys.add(edgeKey);
                registerAdjEdge(bestSource.id, orphanRoot.id);

                let bridgeLabel = "gRPC";
                if (
                  orphanRoot.shape === "hexagon" ||
                  orphanRoot.label.toLowerCase().includes("emotion") ||
                  orphanRoot.label.toLowerCase().includes("classifier") ||
                  orphanRoot.label.toLowerCase().includes("ai")
                ) {
                  bridgeLabel = "Analyze Stream";
                } else if (
                  orphanRoot.shape === "pill" ||
                  orphanRoot.label.toLowerCase().includes("broker") ||
                  orphanRoot.label.toLowerCase().includes("event")
                ) {
                  bridgeLabel = "Publish Event";
                } else if (orphanRoot.shape === "cylinder") {
                  bridgeLabel = "SQL Read / Write";
                }

                validEdges.push({
                  id: `edge-bridge-${bestSource.id}-${orphanRoot.id}-${Date.now()}`,
                  type: CANVAS_EDGE_TYPE,
                  source: bestSource.id,
                  target: orphanRoot.id,
                  sourceHandle: "bottom",
                  targetHandle: "top",
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: "#94a3b8",
                  },
                  data: {
                    label: bridgeLabel,
                  },
                });
              }
            }
          }

          // Check for orphan storage/database nodes (cylinders with 0 incoming edges)
          const nodesWithIncoming = new Set<string>();
          for (const e of flow.edges) nodesWithIncoming.add(e.target);
          for (const e of validEdges) nodesWithIncoming.add(e.target);

          for (const node of nodeList) {
            if (node.shape === "cylinder" && !nodesWithIncoming.has(node.id)) {
              // Find closest upstream service/broker in tier above
              const upstreamCandidates = nodeList.filter(
                (n) =>
                  n.id !== node.id &&
                  n.position.y < node.position.y &&
                  (n.shape === "rectangle" ||
                    n.shape === "pill" ||
                    n.shape === "hexagon")
              );

              if (upstreamCandidates.length > 0) {
                const closestUpstream = upstreamCandidates.reduce(
                  (closest, curr) =>
                    Math.abs(curr.position.x - node.position.x) +
                      Math.abs(curr.position.y - node.position.y) <
                    Math.abs(closest.position.x - node.position.x) +
                      Math.abs(closest.position.y - node.position.y)
                      ? curr
                      : closest
                );

                const edgeKey = `${closestUpstream.id}->${node.id}`;
                if (!existingEdgeKeys.has(edgeKey)) {
                  existingEdgeKeys.add(edgeKey);
                  validEdges.push({
                    id: `edge-db-${closestUpstream.id}-${node.id}-${Date.now()}`,
                    type: CANVAS_EDGE_TYPE,
                    source: closestUpstream.id,
                    target: node.id,
                    sourceHandle: "bottom",
                    targetHandle: "top",
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: "#94a3b8",
                    },
                    data: {
                      label:
                        closestUpstream.shape === "pill"
                          ? "Async Ingest"
                          : "SQL / Persist",
                    },
                  });
                }
              }
            }
          }
        }

        // Add all validated edges to flow
        for (const edge of validEdges) {
          flow.addEdge(edge);
        }
        totalEdgesAdded = validEdges.length;
      }
    );

    // Step 5: Notify complete
    await notifyRoom(
      roomId,
      "completed",
      result.summary || "System design architecture generated successfully.",
      "complete",
      result.nodesToAdd[result.nodesToAdd.length - 1]?.position ?? {
        x: 600,
        y: 500,
      }
    );

    return {
      success: true,
      summary: result.summary,
      nodesAdded: result.nodesToAdd.length,
      edgesAdded: totalEdgesAdded,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[DESIGN_AGENT_EXECUTION_ERROR]", errorMessage);

    await notifyRoom(
      roomId,
      "error",
      `Generation failed: ${errorMessage}`,
      "error"
    );

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Step 6: Clear AI presence
    try {
      await liveblocks.setPresence(roomId, {
        userId: "ghost-ai-agent",
        data: {
          cursor: null,
          thinking: false,
        },
        ttl: 2,
      });
    } catch (clearErr) {
      console.warn("[CLEAR_AI_PRESENCE_WARN]", clearErr);
    }
  }
}
