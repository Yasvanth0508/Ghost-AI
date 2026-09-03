"use client";

import * as React from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  Check,
  Cloud,
  CloudAlert,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollaboratorAvatars } from "@/components/editor/collaborator-avatars";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

export interface EditorNavbarProps extends React.HTMLAttributes<HTMLElement> {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  title?: string;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  showWorkspaceActions?: boolean;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
  onOpenTemplates?: () => void;
  saveStatus?: SaveStatus;
  onSave?: () => void;
}

export function EditorNavbar({
  isSidebarOpen = false,
  onToggleSidebar,
  title = "GhostAI",
  leftSlot,
  centerSlot,
  rightSlot,
  showWorkspaceActions = false,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onShare,
  onOpenTemplates,
  saveStatus = "idle",
  onSave,
  className,
  ...props
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "flex h-14 w-full items-center justify-between border-b border-border bg-surface px-2 sm:px-4 text-primary shrink-0",
        className
      )}
      {...props}
    >
      {/* Left Section */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <PanelLeftOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
        {leftSlot ?? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-primary truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Center Section */}
      <div className="flex items-center justify-center">
        {centerSlot}
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
        {rightSlot ?? (
          <>
            {showWorkspaceActions && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={saveStatus === "saving"}
                  aria-label="Save canvas"
                  title="Save canvas"
                  className={cn(
                    "h-8 w-8 sm:w-auto p-0 sm:px-3 gap-1.5 rounded-xl border-border bg-subtle/50 text-xs font-medium transition-colors shrink-0",
                    saveStatus === "error"
                      ? "text-state-error border-state-error/40 hover:bg-state-error/10"
                      : saveStatus === "saved"
                      ? "text-state-success hover:bg-state-success/10 hover:text-state-success"
                      : saveStatus === "saving"
                      ? "text-brand border-brand/40"
                      : "text-text-secondary hover:bg-subtle hover:text-primary"
                  )}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : saveStatus === "saved" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-state-success" />
                      <span className="hidden sm:inline">Saved</span>
                    </>
                  ) : saveStatus === "error" ? (
                    <>
                      <CloudAlert className="h-3.5 w-3.5 text-state-error" />
                      <span className="hidden sm:inline">Save Error</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenTemplates}
                  aria-label="Templates"
                  title="Templates"
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3 gap-1.5 rounded-xl border-border bg-subtle/50 text-xs font-medium text-text-secondary hover:bg-subtle hover:text-primary transition-colors shrink-0"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Templates</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  aria-label="Share project"
                  title="Share project"
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3 gap-1.5 rounded-xl border-border bg-subtle/50 text-xs font-medium text-text-secondary hover:bg-subtle hover:text-primary transition-colors shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleAiSidebar}
                  aria-label={isAiSidebarOpen ? "Close AI Sidebar" : "Open AI Sidebar"}
                  title="AI Workspace"
                  className={cn(
                    "h-8 gap-1.5 rounded-xl px-2 sm:px-3 text-xs font-medium transition-colors shrink-0",
                    isAiSidebarOpen
                      ? "bg-[#00A300]/15 text-[#00A300] hover:bg-[#00A300]/25 border border-[#00A300]/30"
                      : "text-muted-foreground hover:text-primary hover:bg-subtle"
                  )}
                >
                  <Sparkles className={cn("h-3.5 w-3.5", isAiSidebarOpen ? "text-[#00A300]" : "text-muted-foreground")} />
                  <span className="hidden md:inline">AI Chat</span>
                </Button>
              </>
            )}

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-xs font-medium">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {showWorkspaceActions && (
                  <div className="hidden sm:block">
                    <CollaboratorAvatars />
                  </div>
                )}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-7 w-7 sm:h-8 sm:w-8",
                    },
                  }}
                />
              </div>
            </Show>
          </>
        )}
      </div>
    </header>
  );
}
