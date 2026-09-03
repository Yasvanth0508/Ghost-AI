import { NextResponse } from "next/server";
import { tasks, auth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserIdentity,
  getProjectAccess,
} from "@/lib/project-access";
import { generateTechnicalSpec } from "@/lib/spec-generation-service";
import type { generateSpecTask } from "@/trigger/generate-spec";

export async function POST(req: Request) {
  try {
    const { userId, userEmails } = await getCurrentUserIdentity();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { roomId, chatHistory, nodes, edges, mode } = body;

    if (!roomId || typeof roomId !== "string" || !roomId.trim()) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Resolve project access strictly from roomId
    const access = await getProjectAccess(roomId.trim(), userId, userEmails);

    if (!access.hasAccess || !access.project) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this project" },
        { status: 403 }
      );
    }

    const projectId = access.project.id;
    const validatedNodes = Array.isArray(nodes) ? nodes : [];
    const validatedEdges = Array.isArray(edges) ? edges : [];
    const validatedChat = Array.isArray(chatHistory) ? chatHistory : [];

    // Direct in-process execution mode
    if (mode === "direct") {
      const result = await generateTechnicalSpec({
        projectId,
        roomId: roomId.trim(),
        userId,
        chatHistory: validatedChat,
        nodes: validatedNodes,
        edges: validatedEdges,
        projectName: access.project.name,
        projectDescription: access.project.description || undefined,
      });

      return NextResponse.json({
        mode: "direct",
        success: result.success,
        specId: result.specId,
        filePath: result.filePath,
        markdown: result.markdown,
        error: result.error,
        projectId,
      });
    }

    // Trigger background task via Trigger.dev
    try {
      const handle = await tasks.trigger<typeof generateSpecTask>(
        "generate-spec",
        {
          projectId,
          roomId: roomId.trim(),
          userId,
          chatHistory: validatedChat,
          nodes: validatedNodes,
          edges: validatedEdges,
          projectName: access.project.name,
          projectDescription: access.project.description || undefined,
        }
      );

      // Create TaskRun record in Prisma for ownership tracking
      try {
        await prisma.taskRun.create({
          data: {
            runId: handle.id,
            projectId,
            userId,
          },
        });
      } catch (dbErr) {
        console.error("[SPEC_TASK_RUN_CREATE_ERROR]", dbErr);
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
          expirationTime: "1h",
        });
      } catch (tokenErr) {
        console.error("[TRIGGER_PUBLIC_TOKEN_ERROR]", tokenErr);
      }

      return NextResponse.json({
        runId: handle.id,
        publicToken,
        projectId,
      });
    } catch (triggerErr) {
      console.warn(
        "[TRIGGER_SPEC_DISPATCH_WARN] Trigger.dev offline or failed, falling back to direct execution",
        triggerErr
      );

      // Seamless direct fallback
      const directResult = await generateTechnicalSpec({
        projectId,
        roomId: roomId.trim(),
        userId,
        chatHistory: validatedChat,
        nodes: validatedNodes,
        edges: validatedEdges,
        projectName: access.project.name,
        projectDescription: access.project.description || undefined,
      });

      return NextResponse.json({
        mode: "direct",
        success: directResult.success,
        specId: directResult.specId,
        filePath: directResult.filePath,
        markdown: directResult.markdown,
        error: directResult.error,
        projectId,
      });
    }
  } catch (error) {
    console.error("[AI_SPEC_TRIGGER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
