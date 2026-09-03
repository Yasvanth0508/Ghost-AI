import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserIdentity,
  getProjectAccess,
} from "@/lib/project-access";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId, userEmails } = await getCurrentUserIdentity();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const access = await getProjectAccess(projectId, userId, userEmails);
    if (!access.hasAccess || !access.project) {
      return NextResponse.json(
        { error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    try {
      const messages = await prisma.projectMessage.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({
        messages: messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt.getTime(),
        })),
      });
    } catch (dbErr) {
      console.warn("[PROJECT_MESSAGES_FETCH_WARN]", dbErr);
      return NextResponse.json({ messages: [] });
    }
  } catch (error) {
    console.error("[PROJECT_MESSAGES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId, userEmails } = await getCurrentUserIdentity();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const access = await getProjectAccess(projectId, userId, userEmails);
    if (!access.hasAccess || !access.project) {
      return NextResponse.json(
        { error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { sender, role, content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    try {
      const message = await prisma.projectMessage.create({
        data: {
          projectId,
          sender: sender || "User",
          role: role || "user",
          content: content.trim(),
        },
      });

      return NextResponse.json({
        message: {
          id: message.id,
          sender: message.sender,
          role: message.role,
          content: message.content,
          timestamp: message.createdAt.getTime(),
        },
      });
    } catch (dbErr) {
      console.warn("[PROJECT_MESSAGE_SAVE_WARN]", dbErr);
      return NextResponse.json({
        message: {
          id: `local-${Date.now()}`,
          sender: sender || "User",
          role: role || "user",
          content: content.trim(),
          timestamp: Date.now(),
        },
      });
    }
  } catch (error) {
    console.error("[PROJECT_MESSAGES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
