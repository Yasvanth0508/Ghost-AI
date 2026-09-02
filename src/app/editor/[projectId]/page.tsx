import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProjectsForUser } from "@/lib/projects";
import type { SerializedProject } from "@/types/project";
import { EditorClientLayout } from "@/components/editor/editor-client-layout";

export default async function ProjectEditorPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { projectId } = await props.params;

  if (!projectId) {
    notFound();
  }

  const user = await currentUser();
  const userEmails =
    user?.emailAddresses?.map((email) => email.emailAddress) || [];

  const [project, { ownedProjects, sharedProjects }] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: true,
      },
    }),
    getProjectsForUser(userId, userEmails),
  ]);

  if (!project) {
    notFound();
  }

  const isOwner = project.ownerId === userId;
  const isCollaborator = project.collaborators.some((c) =>
    userEmails.includes(c.email)
  );

  if (!isOwner && !isCollaborator) {
    redirect("/editor");
  }

  const serializedActiveProject: SerializedProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    canvasJsonPath: project.canvasJsonPath,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    isOwner,
  };

  return (
    <EditorClientLayout
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
      activeProject={serializedActiveProject}
    >
      <main className="relative flex flex-1 items-center justify-center bg-base overflow-hidden">
        <div className="text-center p-6">
          <h2 className="text-lg font-semibold text-primary">
            {project.name}
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Room ID: <span className="font-mono text-brand">{project.id}</span>
          </p>
        </div>
      </main>
    </EditorClientLayout>
  );
}
