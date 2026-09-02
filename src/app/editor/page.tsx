import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectsForUser } from "@/lib/projects";
import { EditorClientLayout } from "@/components/editor/editor-client-layout";

export default async function EditorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userEmails =
    user?.emailAddresses?.map((email) => email.emailAddress) || [];

  const { ownedProjects, sharedProjects } = await getProjectsForUser(
    userId,
    userEmails
  );

  return (
    <EditorClientLayout
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
    />
  );
}
