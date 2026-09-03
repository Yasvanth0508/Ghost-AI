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
  onAddShape?: (shape: CanvasNodeShape) => void;
  onTouchDragMove?: (shape: CanvasNodeShape, clientX: number, clientY: number) => void;
  onTouchDragEnd?: (shape: CanvasNodeShape, clientX: number, clientY: number) => void;
}

export function ShapePanel({
  onDragStartShape,
  onDragEnd,
  onAddShape,
  onTouchDragMove,
  onTouchDragEnd,
}: ShapePanelProps = {}) {
  const touchStartRef = React.useRef<{ x: number; y: number; shape: CanvasNodeShape; hasMoved: boolean } | null>(null);

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

  const handleTouchStart = (
    event: React.TouchEvent<HTMLButtonElement>,
    shape: CanvasNodeShape
  ) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      shape,
      hasMoved: false,
    };
    onDragStartShape?.(shape);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (!touchStartRef.current) return;
    const touch = event.touches[0];
    const dist = Math.hypot(
      touch.clientX - touchStartRef.current.x,
      touch.clientY - touchStartRef.current.y
    );

    if (dist > 8) {
      touchStartRef.current.hasMoved = true;
      onTouchDragMove?.(touchStartRef.current.shape, touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (!touchStartRef.current) return;
    const { shape, hasMoved } = touchStartRef.current;
    const touch = event.changedTouches[0];

    if (hasMoved && onTouchDragEnd) {
      onTouchDragEnd(shape, touch.clientX, touch.clientY);
    } else if (!hasMoved && onAddShape) {
      onAddShape(shape);
    }

    touchStartRef.current = null;
    onDragEnd?.();
  };

  return (
    <aside
      aria-label="Shape Palette"
      className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex max-w-[95vw] items-center gap-1 rounded-full border border-border bg-[#111114] px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-2xl select-none overflow-x-auto touch-pan-x"
    >
      <div
        className="hidden sm:flex items-center text-muted-foreground/60 pr-1 pl-0.5"
        title="Drag or tap shapes to add to canvas"
      >
        <GripHorizontal className="h-3.5 w-3.5" />
      </div>

      <div className="hidden sm:block h-4 w-[1px] bg-border mr-0.5" />

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
              onTouchStart={(e) => handleTouchStart(e, item.shape)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => onAddShape?.(item.shape)}
              title={`${item.label} (${shapeDef.defaultWidth}×${shapeDef.defaultHeight}) - Tap or drag to add`}
              className="group relative flex h-8 w-8 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-primary active:cursor-grabbing active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand shrink-0"
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
