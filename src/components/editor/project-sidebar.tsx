"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime, type SerializedProject } from "@/types/project";
import { cn } from "@/lib/utils";

export interface ProjectSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onNewProject?: () => void;
  myProjects?: SerializedProject[];
  sharedProjects?: SerializedProject[];
  onRenameProject?: (project: SerializedProject) => void;
  onDeleteProject?: (project: SerializedProject) => void;
  selectedProjectId?: string;
  onSelectProject?: (project: SerializedProject) => void;
  className?: string;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
  myProjects = [],
  sharedProjects = [],
  onRenameProject,
  onDeleteProject,
  selectedProjectId,
  onSelectProject,
  className,
}: ProjectSidebarProps) {
  const router = useRouter();

  const handleProjectClick = (project: SerializedProject) => {
    if (onSelectProject) {
      onSelectProject(project);
    } else {
      router.push(`/editor/${project.id}`);
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Project Sidebar"
        aria-hidden={!isOpen}
        className={cn(
          "absolute top-14 left-0 bottom-0 z-40 flex w-80 flex-col border-r border-border bg-surface/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none",
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
        <Tabs
          defaultValue="my-projects"
          className="flex flex-1 flex-col overflow-hidden p-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-subtle">
            <TabsTrigger value="my-projects" className="text-xs font-medium">
              My Projects {myProjects.length > 0 && `(${myProjects.length})`}
            </TabsTrigger>
            <TabsTrigger value="shared" className="text-xs font-medium">
              Shared {sharedProjects.length > 0 && `(${sharedProjects.length})`}
            </TabsTrigger>
          </TabsList>

          {/* My Projects Tab Content */}
          <TabsContent
            value="my-projects"
            className="flex flex-1 flex-col overflow-hidden mt-3"
          >
            {myProjects.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle border border-border text-muted-foreground mb-3">
                  <FolderGit2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-primary">
                  No projects yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
                  Create a project to start designing architecture diagrams.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-1 py-1">
                  {myProjects.map((project) => {
                    const isSelected = project.id === selectedProjectId;
                    return (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className={cn(
                          "group flex items-center justify-between rounded-xl p-2.5 text-sm transition-colors cursor-pointer border border-transparent",
                          isSelected
                            ? "bg-accent text-primary border-border"
                            : "hover:bg-subtle text-text-secondary hover:text-primary"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <FolderGit2 className="h-4 w-4 shrink-0 text-brand" />
                          <div className="overflow-hidden min-w-0">
                            <p className="font-medium text-xs truncate text-primary">
                              {project.name}
                            </p>
                            <p
                              suppressHydrationWarning
                              className="text-[10px] text-muted-foreground truncate"
                            >
                              {formatRelativeTime(project.updatedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Owned Project Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Actions for ${project.name}`}
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameProject?.(project);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject?.(project);
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Shared Tab Content */}
          <TabsContent
            value="shared"
            className="flex flex-1 flex-col overflow-hidden mt-3"
          >
            {sharedProjects.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle border border-border text-muted-foreground mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-primary">
                  No shared projects
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
                  Projects shared with you by collaborators will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-1 py-1">
                  {sharedProjects.map((project) => {
                    const isSelected = project.id === selectedProjectId;
                    return (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className={cn(
                          "group flex items-center justify-between rounded-xl p-2.5 text-sm transition-colors cursor-pointer border border-transparent",
                          isSelected
                            ? "bg-accent text-primary border-border"
                            : "hover:bg-subtle text-text-secondary hover:text-primary"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <Users className="h-4 w-4 shrink-0 text-accent-ai-text" />
                          <div className="overflow-hidden min-w-0">
                            <p className="font-medium text-xs truncate text-primary">
                              {project.name}
                            </p>
                            <p
                              suppressHydrationWarning
                              className="text-[10px] text-muted-foreground truncate"
                            >
                              Shared • {formatRelativeTime(project.updatedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Actions are intentionally HIDDEN for shared projects */}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
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
    </>
  );
}
