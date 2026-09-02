import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { SerializedProject } from "@/types/project";
import type { Project, ProjectCollaborator } from "@prisma/client";

export interface UserIdentity {
  userId: string | null;
  primaryEmail: string | null;
  userEmails: string[];
}

export interface ProjectAccessResult {
  project: (Project & { collaborators: ProjectCollaborator[] }) | null;
  serializedProject: SerializedProject | null;
  isOwner: boolean;
  isCollaborator: boolean;
  hasAccess: boolean;
}

export async function getCurrentUserIdentity(): Promise<UserIdentity> {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, primaryEmail: null, userEmails: [] };
  }

  const user = await currentUser();
  const userEmails =
    user?.emailAddresses?.map((email) => email.emailAddress) || [];
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress || userEmails[0] || null;

  return {
    userId,
    primaryEmail,
    userEmails,
  };
}

export function serializeProject(
  p: Project,
  isOwner: boolean
): SerializedProject {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    canvasJsonPath: p.canvasJsonPath,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    isOwner,
  };
}

export async function getProjectAccess(
  roomId: string,
  userId: string,
  userEmails: string[] = []
): Promise<ProjectAccessResult> {
  const project = await prisma.project.findUnique({
    where: { id: roomId },
    include: {
      collaborators: true,
    },
  });

  if (!project) {
    return {
      project: null,
      serializedProject: null,
      isOwner: false,
      isCollaborator: false,
      hasAccess: false,
    };
  }

  const isOwner = project.ownerId === userId;
  const isCollaborator = project.collaborators.some((c) =>
    userEmails.includes(c.email)
  );
  const hasAccess = isOwner || isCollaborator;

  return {
    project,
    serializedProject: hasAccess ? serializeProject(project, isOwner) : null,
    isOwner,
    isCollaborator,
    hasAccess,
  };
}
