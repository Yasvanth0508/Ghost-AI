"use client";

import * as React from "react";

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  isOwner: boolean;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    name: "Payment Gateway Architecture",
    slug: "payment-gateway-architecture",
    updatedAt: "2 hours ago",
    isOwner: true,
  },
  {
    id: "proj-2",
    name: "E-Commerce Microservices",
    slug: "e-commerce-microservices",
    updatedAt: "Yesterday",
    isOwner: true,
  },
  {
    id: "proj-3",
    name: "Auth & Identity Topology",
    slug: "auth-identity-topology",
    updatedAt: "3 days ago",
    isOwner: false,
  },
];

export function useProjectDialogs() {
  const [projects, setProjects] = React.useState<ProjectItem[]>(INITIAL_PROJECTS);
  
  // Dialog Open States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // Form & Selection States
  const [targetProject, setTargetProject] = React.useState<ProjectItem | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Live slug preview
  const slugPreview = React.useMemo(() => generateSlug(projectName), [projectName]);

  // Open Handlers
  const openCreate = React.useCallback(() => {
    setProjectName("");
    setTargetProject(null);
    setIsCreateOpen(true);
  }, []);

  const openRename = React.useCallback((project: ProjectItem) => {
    setTargetProject(project);
    setProjectName(project.name);
    setIsRenameOpen(true);
  }, []);

  const openDelete = React.useCallback((project: ProjectItem) => {
    setTargetProject(project);
    setIsDeleteOpen(true);
  }, []);

  const closeDialogs = React.useCallback(() => {
    setIsCreateOpen(false);
    setIsRenameOpen(false);
    setIsDeleteOpen(false);
    setTargetProject(null);
    setProjectName("");
  }, []);

  // Action Handlers
  const handleCreateProject = React.useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) return;

    setIsLoading(true);
    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: trimmed,
      slug: generateSlug(trimmed) || "untitled-project",
      updatedAt: "Just now",
      isOwner: true,
    };

    setProjects((prev) => [newProject, ...prev]);
    setIsLoading(false);
    closeDialogs();
  }, [projectName, closeDialogs]);

  const handleRenameProject = React.useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetProject) return;
    const trimmed = projectName.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === targetProject.id
          ? {
              ...p,
              name: trimmed,
              slug: generateSlug(trimmed) || p.slug,
              updatedAt: "Just now",
            }
          : p
      )
    );
    setIsLoading(false);
    closeDialogs();
  }, [targetProject, projectName, closeDialogs]);

  const handleDeleteProject = React.useCallback(() => {
    if (!targetProject) return;

    setIsLoading(true);
    setProjects((prev) => prev.filter((p) => p.id !== targetProject.id));
    setIsLoading(false);
    closeDialogs();
  }, [targetProject, closeDialogs]);

  // Derived lists
  const myProjects = React.useMemo(
    () => projects.filter((p) => p.isOwner),
    [projects]
  );
  const sharedProjects = React.useMemo(
    () => projects.filter((p) => !p.isOwner),
    [projects]
  );

  return {
    projects,
    myProjects,
    sharedProjects,
    isCreateOpen,
    setIsCreateOpen,
    isRenameOpen,
    setIsRenameOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    targetProject,
    projectName,
    setProjectName,
    slugPreview,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialogs,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  };
}
