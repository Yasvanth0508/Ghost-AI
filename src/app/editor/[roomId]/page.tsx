import { redirect } from "next/navigation";
import { getCurrentUserIdentity, getProjectAccess } from "@/lib/project-access";
import { getProjectsForUser } from "@/lib/projects";
import { EditorClientLayout } from "@/components/editor/editor-client-layout";
import { AccessDenied } from "@/components/editor/access-denied";

export default async function ProjectEditorPage(props: {
  params: Promise<{ roomId: string }>;
}) {
  const { userId, userEmails } = await getCurrentUserIdentity();

  if (!userId) {
    redirect("/sign-in");
  }

  const { roomId } = await props.params;

  if (!roomId) {
    return <AccessDenied />;
  }

  const [{ hasAccess, serializedProject }, { ownedProjects, sharedProjects }] =
    await Promise.all([
      getProjectAccess(roomId, userId, userEmails),
      getProjectsForUser(userId, userEmails),
    ]);

  if (!hasAccess || !serializedProject) {
    return <AccessDenied />;
  }

  return (
    <EditorClientLayout
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
      activeProject={serializedProject}
    />
  );
}
