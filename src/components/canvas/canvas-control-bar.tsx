"use client";

import * as React from "react";
import { Plus, Minus, Maximize2, Undo2, Redo2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
} from "@liveblocks/react";
import { cn } from "@/lib/utils";

export function CanvasControlBar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const handleZoomIn = () => {
    zoomIn({ duration: 250 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 250 });
  };

  const handleFitView = () => {
    fitView({ duration: 250, padding: 0.2 });
  };

  return (
    <aside
      aria-label="Canvas Controls"
      className="absolute bottom-16 sm:bottom-6 left-3 sm:left-6 z-20 flex items-center gap-1 rounded-full border border-border bg-[#111114] px-2 py-1 shadow-2xl select-none nodrag nopan nowheel"
    >
      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          <Minus className="h-3.5 w-3.5" />
          <span className="sr-only">Zoom Out</span>
        </button>

        <button
          type="button"
          onClick={handleFitView}
          title="Fit View"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="sr-only">Fit View</span>
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only">Zoom In</span>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-1 h-3.5 w-[1px] bg-border" />

      {/* History Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
            canUndo
              ? "text-muted-foreground hover:bg-accent hover:text-primary active:scale-95 cursor-pointer"
              : "text-muted-foreground/30 cursor-not-allowed opacity-40 pointer-events-none"
          )}
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="sr-only">Undo</span>
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
            canRedo
              ? "text-muted-foreground hover:bg-accent hover:text-primary active:scale-95 cursor-pointer"
              : "text-muted-foreground/30 cursor-not-allowed opacity-40 pointer-events-none"
          )}
        >
          <Redo2 className="h-3.5 w-3.5" />
          <span className="sr-only">Redo</span>
        </button>
      </div>
    </aside>
  );
}
