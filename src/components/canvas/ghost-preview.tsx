"use client";

import * as React from "react";
import type { CanvasNodeShape } from "@/types/canvas";
import { cn } from "@/lib/utils";

export interface GhostDragPreviewState {
  shape: CanvasNodeShape;
  width: number;
  height: number;
  x: number;
  y: number;
}

export function GhostPreview({
  preview,
}: {
  preview: GhostDragPreviewState | null;
}) {
  if (!preview) return null;

  const { shape, width, height, x, y } = preview;
  const left = x - width / 2;
  const top = y - height / 2;

  const renderShapeOutline = () => {
    // 1. RECTANGLE
    if (shape === "rectangle") {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-brand/80 bg-brand/15 shadow-xl backdrop-blur-[1px]">
          <span className="text-xs font-semibold capitalize tracking-wide text-brand select-none">
            {shape}
          </span>
        </div>
      );
    }

    // 2. CIRCLE
    if (shape === "circle") {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-brand/80 bg-brand/15 aspect-square shadow-xl backdrop-blur-[1px]">
          <span className="text-xs font-semibold capitalize tracking-wide text-brand select-none">
            {shape}
          </span>
        </div>
      );
    }

    // 3. PILL
    if (shape === "pill") {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-brand/80 bg-brand/15 shadow-xl backdrop-blur-[1px]">
          <span className="text-xs font-semibold capitalize tracking-wide text-brand select-none">
            {shape}
          </span>
        </div>
      );
    }

    // 4. DIAMOND
    if (shape === "diamond") {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <polygon
              points="50,2 98,50 50,98 2,50"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="var(--brand, #38bdf8)"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="relative z-10 text-xs font-semibold capitalize tracking-wide text-brand select-none">
            {shape}
          </span>
        </div>
      );
    }

    // 5. CYLINDER
    if (shape === "cylinder") {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <path
              d="M 2,16 L 2,84 C 2,94 98,94 98,84 L 98,16 Z"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="var(--brand, #38bdf8)"
              strokeWidth="2"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 2,84 C 2,94 98,94 98,84"
              fill="none"
              stroke="var(--brand, #38bdf8)"
              strokeWidth="2"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              cx="50"
              cy="16"
              rx="48"
              ry="12"
              fill="rgba(56, 189, 248, 0.2)"
              stroke="var(--brand, #38bdf8)"
              strokeWidth="2"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="relative z-10 pt-2 text-xs font-semibold capitalize tracking-wide text-brand select-none">
            {shape}
          </span>
        </div>
      );
    }

    // 6. HEXAGON
    if (shape === "hexagon") {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <polygon
              points="25,2 75,2 98,50 75,98 25,98 2,50"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="var(--brand, #38bdf8)"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="relative z-10 text-xs font-semibold capitalize tracking-wide text-brand select-none">
            {shape}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 flex items-center justify-center transition-opacity duration-150 animate-in fade-in"
      )}
      style={{
        left,
        top,
        width,
        height,
      }}
    >
      {renderShapeOutline()}
    </div>
  );
}
