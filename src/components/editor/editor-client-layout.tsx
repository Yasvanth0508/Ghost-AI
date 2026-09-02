"use client";

import * as React from "react";
import {
  Bot,
  Layers,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { SerializedProject } from "@/types/project";
import { cn } from "@/lib/utils";

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
  const [isAiSidebarOpen, setIsAiSidebarOpen] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);

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
            /* Canvas Placeholder */
            <main className="relative flex flex-1 items-center justify-center bg-base overflow-hidden p-6 select-none">
              {/* Subtle background grid effect */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(var(--text-primary) 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative flex max-w-md flex-col items-center rounded-2xl border border-border bg-surface/70 backdrop-blur-sm p-8 text-center shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-subtle text-brand shadow-inner">
                  <Layers className="h-7 w-7" />
                </div>

                <h2 className="text-xl font-bold tracking-tight text-primary">
                  {activeProject.name}
                </h2>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-subtle/80 px-3 py-1 text-xs">
                  <span className="text-muted-foreground">Room ID:</span>
                  <span className="font-mono text-brand font-medium">
                    {activeProject.id}
                  </span>
                </div>

                <p className="mt-4 text-xs text-text-secondary leading-relaxed max-w-xs">
                  Canvas workspace placeholder. Real-time infinite canvas graph, nodes, and connectors will render here.
                </p>
              </div>
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

        {/* Right AI Sidebar Placeholder */}
        {activeProject && (
          <aside
            aria-label="AI Assistant"
            className={cn(
              "flex flex-col border-l border-border bg-surface shadow-2xl transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
              isAiSidebarOpen
                ? "w-80 opacity-100"
                : "w-0 opacity-0 border-l-0 pointer-events-none"
            )}
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-ai-text" />
                <span className="text-sm font-semibold tracking-tight text-primary">
                  Ghost AI
                </span>
                <span className="rounded-md bg-accent-ai/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-ai-text border border-accent-ai/20">
                  Preview
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAiSidebarOpen(false)}
                aria-label="Close AI Sidebar"
                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Assistant Chat Placeholder Body */}
            <div className="flex flex-1 flex-col justify-between p-4 overflow-hidden">
              <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/10 border border-accent-ai/20 text-accent-ai-text mb-3">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-primary">
                  AI Architecture Assistant
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                  Generate architecture nodes, optimize cloud topology, and query system specs directly from chat.
                </p>
              </div>

              {/* Disabled chat input preview */}
              <div className="relative mt-2">
                <input
                  disabled
                  placeholder="Ask AI to design or modify..."
                  className="w-full rounded-xl border border-border bg-subtle/50 px-3.5 py-2.5 pr-10 text-xs text-muted-foreground cursor-not-allowed opacity-75 placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <Button
                  disabled
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg bg-accent-ai/20 text-accent-ai-text cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </aside>
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
