"use client";

import * as React from "react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";
import { Canvas } from "@/components/canvas/canvas";
import {
  CanvasLoadingFallback,
  CanvasErrorFallback,
} from "@/components/canvas/canvas-fallbacks";

import type { SaveStatus } from "@/hooks/use-canvas-autosave";

export interface LiveblocksCanvasProps {
  roomId?: string;
  projectName?: string;
  isTemplatesOpen?: boolean;
  onOpenTemplatesChange?: (open: boolean) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  saveTrigger?: number;
}

export function LiveblocksCanvas({
  roomId,
  isTemplatesOpen,
  onOpenTemplatesChange,
  onSaveStatusChange,
  saveTrigger,
}: LiveblocksCanvasProps) {
  return (
    <ErrorBoundary FallbackComponent={CanvasErrorFallback}>
      <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
        <Canvas
          roomId={roomId}
          isTemplatesOpen={isTemplatesOpen}
          onOpenTemplatesChange={onOpenTemplatesChange}
          onSaveStatusChange={onSaveStatusChange}
          saveTrigger={saveTrigger}
        />
      </ClientSideSuspense>
    </ErrorBoundary>
  );
}
