"use client";

import * as React from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FallbackProps } from "react-error-boundary";

export function CanvasLoadingFallback() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-base p-6 text-center select-none">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative flex max-w-sm flex-col items-center rounded-2xl border border-border bg-surface/80 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h3 className="text-base font-semibold text-primary">
          Connecting to Canvas
        </h3>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Establishing real-time connection and synchronizing workspace nodes...
        </p>
      </div>
    </div>
  );
}

export function CanvasErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-base p-6 text-center select-none">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative flex max-w-md flex-col items-center rounded-2xl border border-destructive/30 bg-surface/90 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-primary">
          Canvas Connection Error
        </h3>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          {error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Unable to connect to the Liveblocks collaboration room. Please check your network or project permissions."}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => resetErrorBoundary()}
            variant="outline"
            className="gap-2 rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2 rounded-xl bg-brand text-black font-medium hover:bg-brand/90 text-xs"
          >
            <span>Reload Page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
