"use client";

import * as React from "react";
import type { useReactFlow } from "@xyflow/react";

interface KeyboardShortcutsOptions {
  reactFlowInstance: ReturnType<typeof useReactFlow>;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  undo,
  redo,
}: KeyboardShortcutsOptions) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      // Ignore shortcuts if the user is typing in any input, textarea, or contentEditable element
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const isModifier = event.metaKey || event.ctrlKey;

      // 1. Zoom In: '+' or '='
      if ((event.key === "+" || event.key === "=") && !isModifier) {
        event.preventDefault();
        reactFlowInstance.zoomIn({ duration: 200 });
        return;
      }

      // 2. Zoom Out: '-'
      if (event.key === "-" && !isModifier) {
        event.preventDefault();
        reactFlowInstance.zoomOut({ duration: 200 });
        return;
      }

      // 3. Undo: Cmd/Ctrl + Z (without Shift)
      if (isModifier && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // 4. Redo: Cmd/Ctrl + Shift + Z OR Cmd/Ctrl + Y
      if (
        (isModifier && event.key.toLowerCase() === "z" && event.shiftKey) ||
        (isModifier && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reactFlowInstance, undo, redo]);
}
