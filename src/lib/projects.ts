import { prisma } from "@/lib/prisma";
import type { SerializedProject } from "@/types/project";
import type { Project } from "@prisma/client";

export async function getProjectsForUser(
  userId: string,
  userEmails: string[] = []
): Promise<{
  ownedProjects: SerializedProject[];
  sharedProjects: SerializedProject[];
}> {
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    }),
    userEmails.length > 0
      ? prisma.project.findMany({
          where: {
            collaborators: {
              some: {
                email: { in: userEmails },
              },
            },
            ownerId: { not: userId },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const serialize = (p: Project, isOwner: boolean): SerializedProject => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    canvasJsonPath: p.canvasJsonPath,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    isOwner,
  });

  return {
    ownedProjects: owned.map((p) => serialize(p, true)),
    sharedProjects: shared.map((p) => serialize(p, false)),
  };
}
