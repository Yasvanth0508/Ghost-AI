"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { LiveblocksCanvas } from "@/components/canvas/liveblocks-canvas";
import { useProjectActions } from "@/hooks/use-project-actions";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import type { SerializedProject } from "@/types/project";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

export interface EditorClientLayoutProps {
  initialOwnedProjects: SerializedProject[];
  initialSharedProjects: SerializedProject[];
  activeProject?: SerializedProject | null;
  children?: React.ReactNode;
}

function EditorClientContent({
  initialOwnedProjects,
  initialSharedProjects,
  activeProject = null,
  children,
}: EditorClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveTrigger, setSaveTrigger] = React.useState(0);

  const handleManualSave = React.useCallback(() => {
    setSaveTrigger((prev) => prev + 1);
  }, []);

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
        showWorkspaceActions={!!activeProject}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
        onShare={() => setIsShareOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        saveStatus={saveStatus}
        onSave={handleManualSave}
      />

      {/* Editor Body Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Floating Project Sidebar */}
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

        {/* Central Workspace / Canvas Area */}
        <div className="relative flex flex-1 overflow-hidden">
          {children ? (
            children
          ) : activeProject ? (
            <main className="relative flex flex-1 h-full w-full overflow-hidden">
              <LiveblocksCanvas
                roomId={activeProject.id}
                projectName={activeProject.name}
                isTemplatesOpen={isTemplatesOpen}
                onOpenTemplatesChange={setIsTemplatesOpen}
                onSaveStatusChange={setSaveStatus}
                saveTrigger={saveTrigger}
              />
            </main>
          ) : (
            /* Minimal Center Home Layout */
            <main className="flex flex-1 flex-col items-center justify-center bg-base p-6 text-center select-none">
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

        {/* Right AI Sidebar */}
        {activeProject && (
          <AiSidebar
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
            roomId={activeProject.id}
          />
        )}
      </div>

      {/* Share Dialog */}
      {activeProject && (
        <ShareDialog
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
          projectId={activeProject.id}
          projectName={activeProject.name}
        />
      )}

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

export function EditorClientLayout(props: EditorClientLayoutProps) {
  if (props.activeProject) {
    return (
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={props.activeProject.id}
          initialPresence={{
            cursor: null,
            thinking: false,
          }}
        >
          <EditorClientContent {...props} />
        </RoomProvider>
      </LiveblocksProvider>
    );
  }

  return <EditorClientContent {...props} />;
}
