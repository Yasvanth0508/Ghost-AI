import { NextResponse } from "next/server";
import { auth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getCurrentUserIdentity } from "@/lib/project-access";

export async function POST(req: Request) {
  try {
    const { userId } = await getCurrentUserIdentity();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { runId } = body;

    if (!runId || typeof runId !== "string") {
      return NextResponse.json(
        { error: "Run ID is required" },
        { status: 400 }
      );
    }

    // Verify task run exists and user owns it
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return NextResponse.json(
        { error: "Task run not found" },
        { status: 404 }
      );
    }

    if (taskRun.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this task run" },
        { status: 403 }
      );
    }

    // Generate scoped public access token with 1 hour expiration
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
      expirationTime: "1h",
    });

    return NextResponse.json({
      runId,
      publicToken,
    });
  } catch (error) {
    console.error("[AI_SPEC_TOKEN_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
