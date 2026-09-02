import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await props.params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Only the project owner can update this project" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData: {
      name?: string;
      description?: string | null;
      status?: "DRAFT" | "ARCHIVED";
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null;
    }

    if (body.status === "DRAFT" || body.status === "ARCHIVED") {
      updateData.status = body.status;
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        collaborators: true,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("[PROJECT_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await props.params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Only the project owner can delete this project" },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
