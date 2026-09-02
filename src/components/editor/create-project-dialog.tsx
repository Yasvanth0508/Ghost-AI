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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  roomIdPreview: string;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  onProjectNameChange,
  roomIdPreview,
  onSubmit,
  isLoading = false,
  error,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Start a new technical architecture design. Give your project a
              name to generate its shared canvas workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="create-project-name"
                className="text-xs font-medium text-primary"
              >
                Project Name
              </label>
              <Input
                id="create-project-name"
                placeholder="e.g., Cloud Event Streaming Engine"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Live Room ID Preview */}
            <div className="rounded-xl border border-border bg-subtle p-3 text-xs">
              <span className="text-muted-foreground">
                Liveblocks Room ID:{" "}
              </span>
              <span className="font-mono text-brand">{roomIdPreview}</span>
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
