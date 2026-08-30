"use client";

import * as React from "react";
import { FolderGit2, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ProjectSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onNewProject?: () => void;
  className?: string;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
  className,
}: ProjectSidebarProps) {
  return (
    <aside
      aria-label="Project Sidebar"
      aria-hidden={!isOpen}
      className={cn(
        "absolute top-14 left-0 bottom-0 z-40 flex w-80 flex-col border-r border-border bg-surface/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold tracking-tight text-primary">
          Projects
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close sidebar"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs Area */}
      <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden p-4">
        <TabsList className="grid w-full grid-cols-2 bg-subtle">
          <TabsTrigger value="my-projects" className="text-xs font-medium">
            My Projects
          </TabsTrigger>
          <TabsTrigger value="shared" className="text-xs font-medium">
            Shared
          </TabsTrigger>
        </TabsList>

        {/* My Projects Tab Content */}
        <TabsContent
          value="my-projects"
          className="flex flex-1 flex-col items-center justify-center text-center p-6 mt-0"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle border border-border text-muted-foreground mb-3">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-primary">No projects yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
            Create a project to start designing and visualizing architecture diagrams.
          </p>
        </TabsContent>

        {/* Shared Tab Content */}
        <TabsContent
          value="shared"
          className="flex flex-1 flex-col items-center justify-center text-center p-6 mt-0"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle border border-border text-muted-foreground mb-3">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-primary">No shared projects</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
            Projects shared with you by collaborators will appear here.
          </p>
        </TabsContent>
      </Tabs>

      {/* Sidebar Footer Action */}
      <div className="border-t border-border p-4 bg-surface">
        <Button
          onClick={onNewProject}
          className="w-full gap-2 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>
    </aside>
  );
}
