"use client";

import * as React from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-base text-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        title="GhostAI Editor"
      />
      <div className="relative flex flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex flex-1 items-center justify-center bg-base p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Canvas Workspace
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Architecture canvas ready for nodes and edges.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
