"use client";

import * as React from "react";
import { ArrowRight, LayoutTemplate, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CANVAS_TEMPLATES,
  CanvasTemplate,
} from "@/components/editor/starter-templates";
import { CanvasNodeShape, SHAPE_DEFINITIONS } from "@/types/canvas";

export interface StarterTemplatesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

// Lightweight SVG Diagram Preview component
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Empty Diagram
      </div>
    );
  }

  // Pre-calculate node geometry & bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const nodeMap = new Map<
    string,
    {
      x: number;
      y: number;
      w: number;
      h: number;
      cx: number;
      cy: number;
      shape: CanvasNodeShape;
      color: string;
      textColor: string;
      label: string;
    }
  >();

  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const shape = (node.data.shape as CanvasNodeShape) || "rectangle";
    const shapeDef = SHAPE_DEFINITIONS[shape];
    const w =
      (typeof node.style?.width === "number" ? node.style.width : null) ??
      shapeDef?.defaultWidth ??
      140;
    const h =
      (typeof node.style?.height === "number" ? node.style.height : null) ??
      shapeDef?.defaultHeight ??
      70;
    const cx = x + w / 2;
    const cy = y + h / 2;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);

    nodeMap.set(node.id, {
      x,
      y,
      w,
      h,
      cx,
      cy,
      shape,
      color: node.data.color || "#1F1F1F",
      textColor: node.data.textColor || "#EDEDED",
      label: node.data.label || "",
    });
  }

  const padding = 36;
  const viewX = minX - padding;
  const viewY = minY - padding;
  const viewW = Math.max(100, maxX - minX + padding * 2);
  const viewH = Math.max(80, maxY - minY + padding * 2);

  const markerId = `preview-arrow-${template.id}`;

  return (
    <svg
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full overflow-hidden select-none pointer-events-none"
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717a" />
        </marker>
      </defs>

      {/* Edges */}
      <g className="edges">
        {edges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          return (
            <line
              key={edge.id}
              x1={source.cx}
              y1={source.cy}
              x2={target.cx}
              y2={target.cy}
              stroke="#52525b"
              strokeWidth="2"
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g className="nodes">
        {Array.from(nodeMap.entries()).map(([id, n]) => {
          const { x, y, w, h, cx, cy, shape, color, textColor, label } = n;
          const displayLabel =
            label.length > 16 ? `${label.slice(0, 14)}…` : label;

          let shapeSvg: React.ReactNode = null;

          if (shape === "circle") {
            const r = Math.min(w, h) / 2;
            shapeSvg = (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                stroke="#3f3f46"
                strokeWidth="1.5"
              />
            );
          } else if (shape === "pill") {
            shapeSvg = (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={h / 2}
                ry={h / 2}
                fill={color}
                stroke="#3f3f46"
                strokeWidth="1.5"
              />
            );
          } else if (shape === "diamond") {
            shapeSvg = (
              <polygon
                points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
                fill={color}
                stroke="#3f3f46"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            );
          } else if (shape === "hexagon") {
            shapeSvg = (
              <polygon
                points={`${x + w * 0.25},${y} ${x + w * 0.75},${y} ${
                  x + w
                },${cy} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${cy}`}
                fill={color}
                stroke="#3f3f46"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            );
          } else if (shape === "cylinder") {
            shapeSvg = (
              <g>
                <path
                  d={`M ${x},${y + h * 0.2} L ${x},${y + h * 0.8} C ${x},${
                    y + h
                  } ${x + w},${y + h} ${x + w},${y + h * 0.8} L ${x + w},${
                    y + h * 0.2
                  } Z`}
                  fill={color}
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                />
                <path
                  d={`M ${x},${y + h * 0.8} C ${x},${y + h} ${x + w},${
                    y + h
                  } ${x + w},${y + h * 0.8}`}
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx={cx}
                  cy={y + h * 0.2}
                  rx={w / 2}
                  ry={h * 0.2}
                  fill={color}
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                />
              </g>
            );
          } else {
            // rectangle default
            shapeSvg = (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={10}
                ry={10}
                fill={color}
                stroke="#3f3f46"
                strokeWidth="1.5"
              />
            );
          }

          return (
            <g key={id}>
              {shapeSvg}
              {displayLabel && (
                <text
                  x={cx}
                  y={shape === "cylinder" ? cy + 4 : cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {displayLabel}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function StarterTemplatesModal({
  isOpen,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleSelectTemplate = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-6 gap-5">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-subtle border border-border text-brand">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-primary">
                Starter Templates
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary mt-0.5">
                Choose a pre-built architecture diagram to jumpstart your canvas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-170px)] pr-3 -mr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
            {CANVAS_TEMPLATES.map((template) => {
              const nodeCount = template.nodes.length;
              const edgeCount = template.edges.length;

              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border bg-subtle/30 p-4 hover:border-brand/50 hover:bg-subtle/60 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md"
                >
                  {/* Visual Diagram Preview */}
                  <div className="h-36 w-full rounded-xl border border-border/80 bg-base/90 p-2 overflow-hidden flex items-center justify-center group-hover:border-brand/30 transition-colors">
                    <TemplatePreview template={template} />
                  </div>

                  {/* Template Meta Info */}
                  <div className="mt-3.5 space-y-1.5 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-primary group-hover:text-brand transition-colors">
                        {template.name}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {nodeCount} nodes
                        </span>
                        <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {edgeCount} edges
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Replaces current canvas
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template);
                      }}
                      className="h-7 gap-1.5 rounded-lg bg-surface border border-border px-3 text-xs font-medium text-primary hover:bg-brand hover:text-black hover:border-brand transition-all"
                    >
                      <Sparkles className="h-3 w-3 text-brand group-hover:text-black transition-colors" />
                      <span>Use Template</span>
                      <ArrowRight className="h-3 w-3 opacity-60" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
