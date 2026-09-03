"use client";

import * as React from "react";
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  useReactFlow,
} from "@xyflow/react";
import type { CanvasEdge } from "@/types/canvas";
import { cn } from "@/lib/utils";

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  data,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const labelText = data?.label || "";

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              data: {
                ...edge.data,
                label: newLabel,
              },
            }
          : edge
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Escape" || e.key === "Enter") {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const strokeColor = selected
    ? "var(--brand, #38bdf8)"
    : isHovered
    ? "#e2e8f0"
    : "#71717a";

  const strokeWidth = selected || isHovered ? 2 : 1.5;

  return (
    <>
      {/* Invisible wider hit-test area for effortless hover & click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      />

      {/* Visible Edge Stroke */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={markerEnd}
        className={cn(
          "transition-all duration-150 pointer-events-none",
          selected && "filter drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]"
        )}
      />

      {/* Inline Edge Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan nowheel z-20"
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={labelText}
              onChange={handleLabelChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onMouseDown={(e) => e.stopPropagation()}
              className="nodrag nopan nowheel rounded-md border border-brand bg-surface/95 px-2.5 py-0.5 text-center text-xs font-semibold text-primary shadow-xl outline-none ring-1 ring-brand/50"
              style={{
                width: `${Math.max(64, labelText.length * 8 + 28)}px`,
              }}
              autoFocus
            />
          ) : labelText ? (
            <div
              className={cn(
                "flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-md backdrop-blur-md transition-all select-none cursor-pointer",
                selected || isHovered
                  ? "border-brand bg-surface text-primary shadow-brand/10"
                  : "border-border/80 bg-surface/90 text-muted-foreground hover:border-border hover:text-primary"
              )}
            >
              {labelText}
            </div>
          ) : (selected || isHovered) ? (
            <div
              className="flex items-center rounded-full border border-dashed border-border/70 bg-surface/80 px-2 py-0.5 text-[10px] font-normal italic text-muted-foreground/60 hover:border-brand hover:text-primary transition-all select-none cursor-pointer"
              title="Double click to add edge label"
            >
              + label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
