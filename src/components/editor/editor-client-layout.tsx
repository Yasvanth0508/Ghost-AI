"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { SerializedProject } from "@/types/project";

export interface EditorClientLayoutProps {
  initialOwnedProjects: SerializedProject[];
  initialSharedProjects: SerializedProject[];
  activeProject?: SerializedProject | null;
  children?: React.ReactNode;
}

export function EditorClientLayout({
  initialOwnedProjects,
  initialSharedProjects,
  activeProject = null,
  children,
}: EditorClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const {
    isCreateOpen,
    setIsCreateOpen,
    isRenameOpen,
    setIsRenameOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    targetProject,
    projectName,
    setProjectName,
    roomIdPreview,
    isLoading,
    error,
    openCreate,
    openRename,
    openDelete,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  } = useProjectActions({
    activeProjectId: activeProject?.id,
  });

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-base text-primary">
      {/* Top Navbar */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        title={activeProject ? activeProject.name : "Ghost AI"}
      />

      {/* Editor Body */}
      <div className="relative flex flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewProject={openCreate}
          myProjects={initialOwnedProjects}
          sharedProjects={initialSharedProjects}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
          selectedProjectId={activeProject?.id}
        />

        {children ? (
          children
        ) : (
          /* Minimal Center Layout */
          <main className="flex flex-1 flex-col items-center justify-center bg-base p-6 text-center">
            <div className="max-w-md space-y-4">
              <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                Create a project or open an existing one
              </h1>
              <p className="text-sm text-text-secondary">
                Start a new architecture workspace, or choose a project from the
                sidebar.
              </p>
              <div className="pt-2">
                <Button
                  onClick={openCreate}
                  className="gap-2 rounded-xl bg-brand text-black font-semibold hover:bg-brand/90 px-5 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Project Management Dialogs */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        roomIdPreview={roomIdPreview}
        onSubmit={handleCreateProject}
        isLoading={isLoading}
        error={error}
      />

      <RenameProjectDialog
        isOpen={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        project={targetProject}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSubmit={handleRenameProject}
        isLoading={isLoading}
        error={error}
      />

      <DeleteProjectDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        project={targetProject}
        onConfirm={handleDeleteProject}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
