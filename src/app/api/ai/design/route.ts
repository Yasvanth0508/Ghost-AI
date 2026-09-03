import { NextResponse } from "next/server";
import { tasks, auth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserIdentity,
  getProjectAccess,
} from "@/lib/project-access";
import { executeDesignAgent } from "@/lib/design-agent-service";
import type { designAgentTask } from "@/trigger/design-agent";

export async function POST(req: Request) {
  try {
    const { userId, userEmails } = await getCurrentUserIdentity();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      roomId,
      projectId: inputProjectId,
      mode,
      chatHistory,
      sender,
    } = body;
    const targetProjectId = inputProjectId || roomId;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!targetProjectId || typeof targetProjectId !== "string") {
      return NextResponse.json(
        { error: "Room or Project ID is required" },
        { status: 400 }
      );
    }

    const access = await getProjectAccess(targetProjectId, userId, userEmails);

    if (!access.hasAccess || !access.project) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this project" },
        { status: 403 }
      );
    }

    // Persist incoming user message to project memory
    try {
      await prisma.projectMessage.create({
        data: {
          projectId: targetProjectId,
          sender: sender || "User",
          role: "user",
          content: prompt.trim(),
        },
      });
    } catch (msgErr) {
      console.warn("[PROJECT_MESSAGE_PERSIST_WARN]", msgErr);
    }

    // Direct in-process execution mode requested
    if (mode === "direct") {
      const result = await executeDesignAgent({
        prompt: prompt.trim(),
        roomId: targetProjectId,
        projectId: targetProjectId,
        userId,
        chatHistory: Array.isArray(chatHistory) ? chatHistory : undefined,
      });

      // Persist assistant reply to project memory
      if (result.success && result.summary) {
        try {
          await prisma.projectMessage.create({
            data: {
              projectId: targetProjectId,
              sender: "Ghost AI",
              role: "assistant",
              content: result.summary,
            },
          });
        } catch (msgErr) {
          console.warn("[PROJECT_ASSISTANT_MESSAGE_PERSIST_WARN]", msgErr);
        }
      }

      return NextResponse.json({
        mode: "direct",
        success: result.success,
        summary: result.summary,
        nodesAdded: result.nodesAdded,
        edgesAdded: result.edgesAdded,
        error: result.error,
        projectId: targetProjectId,
      });
    }

    // Attempt background task trigger via Trigger.dev
    try {
      const handle = await tasks.trigger<typeof designAgentTask>(
        "design-agent",
        {
          prompt: prompt.trim(),
          roomId: targetProjectId,
          projectId: targetProjectId,
          userId,
          chatHistory: Array.isArray(chatHistory) ? chatHistory : undefined,
        }
      );

      // Create TaskRun record in Prisma to track ownership
      try {
        await prisma.taskRun.create({
          data: {
            runId: handle.id,
            projectId: targetProjectId,
            userId,
          },
        });
      } catch (dbErr) {
        console.error("[TASK_RUN_CREATE_ERROR]", dbErr);
      }

      // Generate public token scoped to this run for realtime client monitoring
      let publicToken: string | null = null;
      try {
        publicToken = await auth.createPublicToken({
          scopes: {
            read: {
              runs: [handle.id],
            },
          },
        });
      } catch (tokenErr) {
        console.error("[TRIGGER_PUBLIC_TOKEN_ERROR]", tokenErr);
      }

      return NextResponse.json({
        runId: handle.id,
        publicToken,
        projectId: targetProjectId,
      });
    } catch (triggerErr) {
      console.warn(
        "[TRIGGER_DISPATCH_WARN] Trigger.dev offline or failed, falling back to direct execution",
        triggerErr
      );

      // Seamless direct fallback
      const directResult = await executeDesignAgent({
        prompt: prompt.trim(),
        roomId: targetProjectId,
        projectId: targetProjectId,
        userId,
        chatHistory: Array.isArray(chatHistory) ? chatHistory : undefined,
      });

      // Persist assistant reply to project memory
      if (directResult.success && directResult.summary) {
        try {
          await prisma.projectMessage.create({
            data: {
              projectId: targetProjectId,
              sender: "Ghost AI",
              role: "assistant",
              content: directResult.summary,
            },
          });
        } catch (msgErr) {
          console.warn("[PROJECT_ASSISTANT_MESSAGE_PERSIST_WARN]", msgErr);
        }
      }

      return NextResponse.json({
        mode: "direct",
        success: directResult.success,
        summary: directResult.summary,
        nodesAdded: directResult.nodesAdded,
        edgesAdded: directResult.edgesAdded,
        error: directResult.error,
        projectId: targetProjectId,
      });
    }
  } catch (error) {
    console.error("[AI_DESIGN_TRIGGER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
