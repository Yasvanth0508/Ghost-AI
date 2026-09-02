import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ projectId: string; collaboratorId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, collaboratorId } = await props.params;

    if (!projectId || !collaboratorId) {
      return NextResponse.json(
        { error: "Project ID and Collaborator ID are required" },
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
        { error: "Forbidden: Only the project owner can remove collaborators" },
        { status: 403 }
      );
    }

    const collaborator = await prisma.projectCollaborator.findFirst({
      where: {
        id: collaboratorId,
        projectId,
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 }
      );
    }

    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("[PROJECT_COLLABORATOR_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
