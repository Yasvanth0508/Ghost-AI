"use client";

import * as React from "react";
import type {
  CollaboratorOwnerInfo,
  CollaboratorsResponse,
  ProjectCollaboratorEnriched,
} from "@/types/project";

export interface UseShareDialogOptions {
  projectId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useShareDialog({
  projectId,
  isOpen,
  onOpenChange,
}: UseShareDialogOptions) {
  const [collaborators, setCollaborators] = React.useState<
    ProjectCollaboratorEnriched[]
  >([]);
  const [owner, setOwner] = React.useState<CollaboratorOwnerInfo | null>(null);
  const [isOwner, setIsOwner] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInviting, setIsInviting] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  const fetchCollaborators = React.useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load collaborators");
      }

      const data: CollaboratorsResponse = await res.json();
      setIsOwner(data.isOwner);
      setOwner(data.owner);
      setCollaborators(data.collaborators);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load collaborators";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    let ignore = false;

    if (isOpen && projectId) {
      fetch(`/api/projects/${projectId}/collaborators`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to load collaborators");
          }
          return res.json() as Promise<CollaboratorsResponse>;
        })
        .then((data) => {
          if (!ignore) {
            setIsOwner(data.isOwner);
            setOwner(data.owner);
            setCollaborators(data.collaborators);
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            const message =
              err instanceof Error ? err.message : "Failed to load collaborators";
            setError(message);
            setIsLoading(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, projectId]);

  const copyProjectLink = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }, []);

  const handleInvite = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!projectId) return;

      const trimmed = emailInput.trim();
      if (!trimmed) return;

      setIsInviting(true);
      setError(null);

      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to invite collaborator");
        }

        const newCollaborator: ProjectCollaboratorEnriched = await res.json();
        setCollaborators((prev) => [...prev, newCollaborator]);
        setEmailInput("");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to invite collaborator";
        setError(message);
      } finally {
        setIsInviting(false);
      }
    },
    [projectId, emailInput]
  );

  const handleRemove = React.useCallback(
    async (collaboratorId: string) => {
      if (!projectId) return;

      setRemovingId(collaboratorId);
      setError(null);

      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators/${collaboratorId}`,
          {
            method: "DELETE",
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to remove collaborator");
        }

        setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to remove collaborator";
        setError(message);
      } finally {
        setRemovingId(null);
      }
    },
    [projectId]
  );

  return {
    isOpen,
    onOpenChange,
    isOwner,
    owner,
    collaborators,
    emailInput,
    setEmailInput,
    isLoading,
    isInviting,
    removingId,
    error,
    isCopied,
    copyProjectLink,
    handleInvite,
    handleRemove,
    fetchCollaborators,
  };
}
