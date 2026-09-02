"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SerializedProject } from "@/types/project";

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

export function generateRoomId(name: string): string {
  const slug = slugify(name);
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${suffix}`;
}

export interface UseProjectActionsOptions {
  activeProjectId?: string;
  onProjectCreated?: (project: SerializedProject) => void;
}

export function useProjectActions(options: UseProjectActionsOptions = {}) {
  const router = useRouter();
  const { activeProjectId } = options;

  // Dialog open states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // Form & target states
  const [targetProject, setTargetProject] =
    React.useState<SerializedProject | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [randomSuffix, setRandomSuffix] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Live room ID preview
  const roomIdPreview = React.useMemo(() => {
    const slug = slugify(projectName);
    return `${slug}-${randomSuffix || "room"}`;
  }, [projectName, randomSuffix]);

  const openCreate = React.useCallback(() => {
    setProjectName("");
    setRandomSuffix(Math.random().toString(36).substring(2, 7));
    setError(null);
    setIsCreateOpen(true);
  }, []);

  const openRename = React.useCallback((project: SerializedProject) => {
    setTargetProject(project);
    setProjectName(project.name);
    setError(null);
    setIsRenameOpen(true);
  }, []);

  const openDelete = React.useCallback((project: SerializedProject) => {
    setTargetProject(project);
    setError(null);
    setIsDeleteOpen(true);
  }, []);

  const closeDialogs = React.useCallback(() => {
    setIsCreateOpen(false);
    setIsRenameOpen(false);
    setIsDeleteOpen(false);
    setTargetProject(null);
    setProjectName("");
    setError(null);
  }, []);

  const handleCreateProject = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = projectName.trim() || "Untitled Project";

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create project");
        }

        const project = await res.json();
        closeDialogs();
        router.push(`/editor/${project.id}`);
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create project";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [projectName, closeDialogs, router]
  );

  const handleRenameProject = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!targetProject) return;
      const trimmed = projectName.trim();
      if (!trimmed) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/projects/${targetProject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to rename project");
        }

        closeDialogs();
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to rename project";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [targetProject, projectName, closeDialogs, router]
  );

  const handleDeleteProject = React.useCallback(async () => {
    if (!targetProject) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete project");
      }

      const isCurrentActive = activeProjectId === targetProject.id;
      closeDialogs();

      if (isCurrentActive) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete project";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [targetProject, activeProjectId, closeDialogs, router]);

  return {
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
    closeDialogs,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  };
}
