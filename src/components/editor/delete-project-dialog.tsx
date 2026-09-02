"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SerializedProject } from "@/types/project";

export interface DeleteProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: SerializedProject | null;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  project,
  onConfirm,
  isLoading = false,
  error,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-primary">
              &ldquo;{project?.name}&rdquo;
            </span>
            ? This action cannot be undone and will permanently remove the
            project canvas and its generated specs.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-xs text-destructive font-medium pt-2">{error}</p>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
