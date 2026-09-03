import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { liveblocks } from "@/lib/liveblocks";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

import { mutateFlow } from "@liveblocks/react-flow/node";

export const ChatMessageSchema = z.object({
  id: z.string().optional(),
  sender: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]).optional().default("user"),
  content: z.string(),
  timestamp: z.number().optional(),
});

export const SpecGenerationInputSchema = z.object({
  projectId: z.string(),
  roomId: z.string().optional(),
  userId: z.string().optional(),
  chatHistory: z.array(ChatMessageSchema).default([]),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
  projectName: z.string().optional(),
  projectDescription: z.string().optional(),
});

export type SpecGenerationInput = z.infer<typeof SpecGenerationInputSchema>;

export interface SpecGenerationResult {
  success: boolean;
  specId?: string;
  title?: string;
  filePath?: string;
  markdown?: string;
  error?: string;
  timestamp: string;
}

const SPEC_SYSTEM_PROMPT = `You are Ghost AI, a Principal Systems Architect and Technical Writer.
Your mission is to generate a comprehensive, highly detailed, production-ready Technical Architecture Specification document in standard GitHub-flavored Markdown based on the provided system canvas topology, component interactions, and architectural discussions.

### Writing & Formatting Rules:
1. Tone & Style: Authoritative, precise, production-grade technical engineering document.
2. Format: Standard Markdown with clear headers (#, ##, ###), tables, code blocks, bullet points, and diagrams/ASCII flow where appropriate.
3. Structure:
   # [System / Project Name] — Technical Architecture Specification
   
   ## 1. Executive Summary & Problem Scope
   - High-level purpose and core business/engineering objectives.
   - Target scale, concurrency expectations, latency bounds, and availability targets (e.g. 99.99%).
   
   ## 2. High-Level System Architecture
   - Comprehensive topology breakdown.
   - Tier-by-tier decomposition (Clients/Ingress, Gateways, Core Microservices, Async Processing/Queues, Databases & Storage).
   - Architectural pattern identification (e.g., Event-Driven, Microservices, CQRS, Hexagonal).
   
   ## 3. Component Deep Dive & Specifications
   - Detail every component/module present in the canvas graph (Name, Shape/Role, Responsibilities, Technologies, APIs exposed, internal state).
   
   ## 4. Data Flow, Protocols & Communication Interfaces
   - Step-by-step request/response lifecycle for key user workflows.
   - Detailed breakdown of all network connections, protocols (HTTPS/REST, gRPC, WebSocket), payload formats, and message queues/topics.
   
   ## 5. Security, Authentication & Access Boundaries
   - Identity & access management (JWT, OAuth2, mTLS, API Keys).
   - Network boundaries, zero-trust perimeter, ingress firewalls, encryption in transit & at rest.
   
   ## 6. Scalability, Caching & Resilience Strategies
   - Horizontal scaling, auto-scaling thresholds.
   - Caching layers (CDN, Redis, Read Replicas), cache invalidation policies.
   - Fault tolerance, circuit breakers, rate limiting, retry backoffs, and disaster recovery.
   
   ## 7. Storage Engine & Schema Topology
   - Database choices (Relational SQL, NoSQL, Time-Series, Object Storage).
   - Data partitioning, replication strategy, indexing, and backup retention.
   
   ## 8. Deployment, Observability & Infrastructure
   - Containerization, orchestration (Kubernetes, Serverless), CI/CD pipeline.
   - Telemetry (Prometheus/Grafana, OpenTelemetry, structured logging, distributed tracing).

Produce a complete, thorough, fully elaborated technical specification. Do not use placeholder summaries.`;

export async function generateTechnicalSpec(
  rawInput: SpecGenerationInput
): Promise<SpecGenerationResult> {
  const validated = SpecGenerationInputSchema.parse(rawInput);
  const {
    projectId,
    roomId,
    chatHistory,
    nodes,
    edges,
    projectName,
    projectDescription,
  } = validated;

  const targetRoomId = roomId || projectId;

  try {
    // 1. Notify room if Liveblocks roomId is present
    if (targetRoomId) {
      try {
        await liveblocks.broadcastEvent(targetRoomId, {
          type: "ai-status",
          data: {
            text: "Synthesizing canvas topology and generating technical specification...",
            status: "thinking",
            step: "spec-generation",
            timestamp: Date.now(),
          },
        });
      } catch (broadcastErr) {
        console.warn("[SPEC_BROADCAST_WARN]", broadcastErr);
      }
    }

    // 2. Format Canvas Topology Context (fetch live state if empty)
    let typedNodes = nodes as CanvasNode[];
    let typedEdges = edges as CanvasEdge[];

    if (typedNodes.length === 0 && targetRoomId) {
      try {
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId: targetRoomId },
          async (flow) => {
            typedNodes = [...flow.nodes];
            typedEdges = [...flow.edges];
          }
        );
      } catch (readErr) {
        console.warn("[SPEC_CANVAS_READ_WARN] Could not read live canvas", readErr);
      }
    }

    const nodesContext = typedNodes.map((n) => ({
      id: n.id,
      label: n.data?.label || n.id,
      shape: n.data?.shape || "rectangle",
      color: n.data?.color,
      position: n.position,
    }));

    const edgesContext = typedEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.data?.label || "connects to",
    }));

    const chatContext = chatHistory.map((c) => ({
      role: c.role || "user",
      sender: c.sender || "User",
      content: c.content,
    }));

    // 3. Prepare Gemini AI client
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "";

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const userPrompt = `
PROJECT CONTEXT:
- Project Name: "${projectName || "System Architecture"}"
- Description: "${projectDescription || "Distributed cloud-native architecture"}"

CANVAS GRAPH TOPOLOGY:
- Nodes (${nodesContext.length} components): ${JSON.stringify(nodesContext, null, 2)}
- Edges (${edgesContext.length} connections): ${JSON.stringify(edgesContext, null, 2)}

CHAT CONVERSATION HISTORY:
${JSON.stringify(chatContext, null, 2)}

Generate a complete, thorough, production-grade Technical Architecture Specification in Markdown document format according to the specification guidelines.`;

    // 4. Candidate modern Gemini models
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

    let generatedMarkdown: string | undefined;
    let lastError: unknown;

    for (const modelName of candidateModels) {
      try {
        const generation = await generateText({
          model: google(modelName),
          system: SPEC_SYSTEM_PROMPT,
          prompt: userPrompt,
        });
        generatedMarkdown = generation.text;
        if (generatedMarkdown && generatedMarkdown.trim().length > 0) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(
          `[SPEC_GEMINI_MODEL_ATTEMPT] Model ${modelName} failed, trying next candidate...`,
          err
        );
      }
    }

    if (!generatedMarkdown) {
      throw (
        lastError ||
        new Error("All candidate Gemini models failed to generate technical spec.")
      );
    }

    // 5. Extract Title, Spec ID and Upload to Vercel Blob
    const titleMatch = generatedMarkdown.match(/^#\s+(.+)$/m);
    const specTitle = titleMatch
      ? titleMatch[1].replace(/—|-/g, " ").trim()
      : `${projectName || "System"} Architecture Specification`;

    const specId = `spec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let filePath = `specs/${projectId}/${specId}.md`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(filePath, generatedMarkdown, {
          access: "private",
          contentType: "text/markdown; charset=utf-8",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        if (blob?.url) {
          filePath = blob.url;
        }
      } catch {
        try {
          const blob = await put(filePath, generatedMarkdown, {
            access: "public",
            contentType: "text/markdown; charset=utf-8",
            addRandomSuffix: false,
            allowOverwrite: true,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          if (blob?.url) {
            filePath = blob.url;
          }
        } catch (fallbackBlobErr) {
          console.warn(
            "[SPEC_BLOB_UPLOAD_WARN] Could not upload to Vercel Blob, persisting in PostgreSQL",
            fallbackBlobErr
          );
        }
      }
    }

    // 6. Save ProjectSpec Record in Database (Dual-layer persistence)
    try {
      await prisma.projectSpec.create({
        data: {
          id: specId,
          projectId,
          title: specTitle,
          filePath,
          content: generatedMarkdown,
        },
      });
    } catch (dbErr) {
      console.error("[PROJECT_SPEC_DB_CREATE_ERROR]", dbErr);
    }

    // 7. Notify room of completion
    if (targetRoomId) {
      try {
        await liveblocks.broadcastEvent(targetRoomId, {
          type: "ai-status",
          data: {
            text: "Technical architecture specification generated successfully!",
            status: "completed",
            step: "complete",
            timestamp: Date.now(),
          },
        });
      } catch (broadcastErr) {
        console.warn("[SPEC_COMPLETE_BROADCAST_WARN]", broadcastErr);
      }
    }

    return {
      success: true,
      specId,
      title: specTitle,
      filePath,
      markdown: generatedMarkdown,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[SPEC_GENERATION_SERVICE_ERROR]", errorMessage);

    if (targetRoomId) {
      try {
        await liveblocks.broadcastEvent(targetRoomId, {
          type: "ai-status",
          data: {
            text: `Spec generation failed: ${errorMessage}`,
            status: "error",
            step: "error",
            timestamp: Date.now(),
          },
        });
      } catch {
        // ignore
      }
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}
