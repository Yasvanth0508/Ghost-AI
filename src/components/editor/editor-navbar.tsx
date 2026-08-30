"use client";

import * as React from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EditorNavbarProps extends React.HTMLAttributes<HTMLElement> {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  title?: string;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function EditorNavbar({
  isSidebarOpen = false,
  onToggleSidebar,
  title = "GhostAI",
  leftSlot,
  centerSlot,
  rightSlot,
  className,
  ...props
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "flex h-14 w-full items-center justify-between border-b border-border bg-surface px-4 text-primary",
        className
      )}
      {...props}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
        {leftSlot ?? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-primary">
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
      <div className="flex items-center justify-end gap-3">
        {rightSlot ?? (
          <>
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
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </Show>
          </>
        )}
      </div>
    </header>
  );
}
