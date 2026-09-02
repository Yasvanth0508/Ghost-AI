import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClerkOwnerInfo, getClerkUsersByEmails } from "@/lib/clerk-users";
import type {
  CollaboratorsResponse,
  ProjectCollaboratorEnriched,
} from "@/types/project";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(
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

    const [project, user] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          collaborators: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      currentUser(),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userEmails =
      user?.emailAddresses?.map((e) => e.emailAddress.toLowerCase()) || [];
    const isOwner = project.ownerId === userId;
    const isCollaborator = project.collaborators.some((c) =>
      userEmails.includes(c.email.toLowerCase())
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this project" },
        { status: 403 }
      );
    }

    const [ownerInfo, clerkMap] = await Promise.all([
      getClerkOwnerInfo(project.ownerId),
      getClerkUsersByEmails(project.collaborators.map((c) => c.email)),
    ]);

    const enrichedCollaborators: ProjectCollaboratorEnriched[] =
      project.collaborators.map((c) => {
        const info = clerkMap.get(c.email.toLowerCase());
        return {
          id: c.id,
          email: c.email,
          name: info?.name || null,
          imageUrl: info?.imageUrl || null,
          createdAt: c.createdAt.toISOString(),
        };
      });

    const response: CollaboratorsResponse = {
      isOwner,
      owner: ownerInfo,
      collaborators: enrichedCollaborators,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PROJECT_COLLABORATORS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const [project, user] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          collaborators: true,
        },
      }),
      currentUser(),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Only the project owner can invite collaborators" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const normalizedEmail = rawEmail.toLowerCase();

    if (!rawEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const ownerEmails =
      user?.emailAddresses?.map((e) => e.emailAddress.toLowerCase()) || [];

    if (ownerEmails.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: "Cannot invite the project owner as a collaborator" },
        { status: 400 }
      );
    }

    const isAlreadyCollaborator = project.collaborators.some(
      (c) => c.email.toLowerCase() === normalizedEmail
    );

    if (isAlreadyCollaborator) {
      return NextResponse.json(
        { error: "This user is already a collaborator on this project" },
        { status: 409 }
      );
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        email: normalizedEmail,
      },
    });

    const clerkMap = await getClerkUsersByEmails([normalizedEmail]);
    const info = clerkMap.get(normalizedEmail);

    const enriched: ProjectCollaboratorEnriched = {
      id: collaborator.id,
      email: collaborator.email,
      name: info?.name || null,
      imageUrl: info?.imageUrl || null,
      createdAt: collaborator.createdAt.toISOString(),
    };

    return NextResponse.json(enriched, { status: 201 });
  } catch (error) {
    console.error("[PROJECT_COLLABORATORS_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
