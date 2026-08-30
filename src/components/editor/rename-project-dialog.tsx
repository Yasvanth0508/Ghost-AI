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
import type { ProjectItem } from "@/hooks/use-project-dialogs";

export interface RenameProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectItem | null;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
}

export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  project,
  projectName,
  onProjectNameChange,
  onSubmit,
  isLoading = false,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Rename{" "}
              <span className="font-semibold text-primary">
                &ldquo;{project?.name}&rdquo;
              </span>{" "}
              to update its title across your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="rename-project-name"
                className="text-xs font-medium text-primary"
              >
                Project Name
              </label>
              <Input
                id="rename-project-name"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>
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
              disabled={!projectName.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
