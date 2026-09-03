"use client";

import * as React from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseCanvasAutosaveOptions {
  projectId?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled?: boolean;
  debounceMs?: number;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

export interface UseCanvasAutosaveReturn {
  saveStatus: SaveStatus;
  saveNow: () => Promise<void>;
  lastSavedAt: Date | null;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
  debounceMs = 1500,
  onSaveStatusChange,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveReturn {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const lastSavedHashRef = React.useRef<string>("");
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = React.useRef(false);

  const updateStatus = React.useCallback(
    (status: SaveStatus) => {
      setSaveStatus(status);
      onSaveStatusChange?.(status);
    },
    [onSaveStatusChange]
  );

  const performSave = React.useCallback(
    async (currentNodes: CanvasNode[], currentEdges: CanvasEdge[]) => {
      if (!projectId || isSavingRef.current) return;

      const currentHash = JSON.stringify({ nodes: currentNodes, edges: currentEdges });
      if (currentHash === lastSavedHashRef.current) {
        return;
      }

      try {
        isSavingRef.current = true;
        updateStatus("saving");

        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodes: currentNodes,
            edges: currentEdges,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save canvas (status ${response.status})`);
        }

        lastSavedHashRef.current = currentHash;
        const now = new Date();
        setLastSavedAt(now);
        updateStatus("saved");
      } catch (err) {
        console.error("[AUTOSAVE_ERROR]", err);
        updateStatus("error");
      } finally {
        isSavingRef.current = false;
      }
    },
    [projectId, updateStatus]
  );

  const saveNow = React.useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await performSave(nodes, edges);
  }, [nodes, edges, performSave]);

  // Set initial hash once when enabled starts to prevent saving unaltered state
  React.useEffect(() => {
    if (enabled && !lastSavedHashRef.current) {
      lastSavedHashRef.current = JSON.stringify({ nodes, edges });
    }
  }, [enabled, nodes, edges]);

  // Watch nodes and edges changes and trigger debounced autosave
  React.useEffect(() => {
    if (!enabled || !projectId) return;

    const currentHash = JSON.stringify({ nodes, edges });
    if (!lastSavedHashRef.current) {
      lastSavedHashRef.current = currentHash;
      return;
    }

    if (currentHash === lastSavedHashRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    updateStatus("saving");

    debounceTimerRef.current = setTimeout(() => {
      performSave(nodes, edges);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nodes, edges, enabled, projectId, debounceMs, performSave, updateStatus]);

  return {
    saveStatus,
    saveNow,
    lastSavedAt,
  };
}
