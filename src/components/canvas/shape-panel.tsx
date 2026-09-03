"use client";

import * as React from "react";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
  GripHorizontal,
} from "lucide-react";
import {
  CanvasNodeShape,
  SHAPE_DEFINITIONS,
} from "@/types/canvas";

interface ShapeItem {
  shape: CanvasNodeShape;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SHAPES: ShapeItem[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
];

export interface ShapePanelProps {
  onDragStartShape?: (shape: CanvasNodeShape) => void;
  onDragEnd?: () => void;
}

export function ShapePanel({ onDragStartShape, onDragEnd }: ShapePanelProps = {}) {
  const onDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape
  ) => {
    const shapeDef = SHAPE_DEFINITIONS[shape];
    const payload = JSON.stringify({
      shape,
      defaultWidth: shapeDef.defaultWidth,
      defaultHeight: shapeDef.defaultHeight,
    });

    event.dataTransfer.setData("application/reactflow", payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "move";

    if (onDragStartShape) {
      onDragStartShape(shape);
    }
  };

  return (
    <aside
      aria-label="Shape Palette"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-border bg-surface/90 px-3 py-1.5 shadow-2xl backdrop-blur-md select-none"
    >
      <div className="flex items-center text-muted-foreground/60 pr-1 pl-0.5" title="Drag shapes to canvas">
        <GripHorizontal className="h-3.5 w-3.5" />
      </div>

      <div className="h-4 w-[1px] bg-border mr-0.5" />

      <div className="flex items-center gap-1">
        {SHAPES.map((item) => {
          const Icon = item.icon;
          const shapeDef = SHAPE_DEFINITIONS[item.shape];

          return (
            <button
              key={item.shape}
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, item.shape)}
              onDragEnd={() => onDragEnd && onDragEnd()}
              title={`${item.label} (${shapeDef.defaultWidth}×${shapeDef.defaultHeight}) - Drag to canvas`}
              className="group relative flex h-8 w-8 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-primary active:cursor-grabbing active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="sr-only">Add {item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
