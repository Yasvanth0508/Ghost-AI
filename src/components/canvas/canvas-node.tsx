"use client";

import * as React from "react";
import {
  Handle,
  Position,
  NodeProps,
  NodeResizer,
  NodeToolbar,
  useReactFlow,
} from "@xyflow/react";
import { Pencil, Trash2 } from "lucide-react";
import {
  CanvasNode,
  CanvasNodeShape,
  NODE_COLORS,
  DEFAULT_NODE_COLOR,
} from "@/types/canvas";
import { cn } from "@/lib/utils";

export function CanvasNodeComponent({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) {
  const shape = (data.shape as CanvasNodeShape) || "rectangle";
  const labelText = data.label || "";
  const fallbackLabel = data.shape || "Node";
  const customColor = data.color || DEFAULT_NODE_COLOR.fill;
  const customTextColor = data.textColor || DEFAULT_NODE_COLOR.text;

  const { updateNodeData, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [hoveredColorId, setHoveredColorId] = React.useState<string | null>(null);

  // Auto-focus and select textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { label: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      setIsEditing(false);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  // Color & Actions toolbar
  const renderColorToolbar = () => (
    <NodeToolbar
      isVisible={selected}
      position={Position.Top}
      offset={10}
      className="nodrag nopan nowheel z-30"
    >
      <div
        className="flex items-center gap-1 rounded-full border border-border bg-[#111114] px-2 py-1 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {NODE_COLORS.map((colorOption) => {
          const isActive = customColor.toLowerCase() === colorOption.fill.toLowerCase();
          const isHovered = hoveredColorId === colorOption.id;

          return (
            <button
              key={colorOption.id}
              type="button"
              onMouseEnter={() => setHoveredColorId(colorOption.id)}
              onMouseLeave={() => setHoveredColorId(null)}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, {
                  color: colorOption.fill,
                  textColor: colorOption.text,
                });
              }}
              title={`${colorOption.name} Theme`}
              className={cn(
                "relative h-4 w-4 rounded-full border border-white/20 transition-all duration-150 focus-visible:outline-none",
                isActive && "scale-110 ring-2 ring-white/90 border-transparent",
                !isActive && "hover:scale-105"
              )}
              style={{
                backgroundColor: colorOption.fill,
                boxShadow: isHovered
                  ? `0 0 8px ${colorOption.text}88, inset 0 0 0 1px ${colorOption.text}`
                  : undefined,
              }}
            >
              <span className="sr-only">{colorOption.name}</span>
            </button>
          );
        })}

        <div className="h-3.5 w-[1px] bg-border mx-0.5" />

        {/* Mobile-Friendly Quick Actions: Edit Label & Delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          title="Edit Text"
          className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          <span className="sr-only">Edit text</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteElements({ nodes: [{ id }] });
          }}
          title="Delete Node"
          className="flex h-5 w-5 items-center justify-center rounded-md text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Delete node</span>
        </button>
      </div>
    </NodeToolbar>
  );

  // Render Label Text or Inline Editor
  const renderLabel = () => (
    <div
      className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden p-2.5 text-center select-none"
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={labelText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          rows={2}
          style={{ color: customTextColor }}
          className="nodrag nopan nowheel h-auto max-h-full w-full resize-none overflow-hidden bg-transparent text-center font-semibold text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 leading-snug"
          placeholder={fallbackLabel}
        />
      ) : (
        <div className="flex flex-col items-center justify-center overflow-hidden max-w-full cursor-text">
          {labelText ? (
            <span
              className="line-clamp-3 max-w-full text-xs font-semibold leading-snug break-words hyphens-auto text-center selection:bg-brand/30"
              style={{ color: customTextColor }}
              title={labelText}
            >
              {labelText}
            </span>
          ) : (
            <span
              className="text-[11px] font-normal italic capitalize line-clamp-2 max-w-full opacity-70 text-center"
              style={{ color: customTextColor }}
            >
              {fallbackLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Common Connection Handles
  const renderHandles = () => (
    <>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!h-2 !w-2 !rounded-full !border !border-[#18181b] !bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:!scale-125 z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2 !w-2 !rounded-full !border !border-[#18181b] !bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:!scale-125 z-20"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2 !w-2 !rounded-full !border !border-[#18181b] !bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:!scale-125 z-20"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!h-2 !w-2 !rounded-full !border !border-[#18181b] !bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:!scale-125 z-20"
      />
    </>
  );

  // Resize Controls
  const renderResizer = () => (
    <NodeResizer
      isVisible={selected}
      minWidth={60}
      minHeight={40}
      lineClassName="!border-brand/40"
      handleClassName="!h-2 !w-2 !bg-brand !border !border-border !rounded-sm hover:!scale-125 transition-transform"
    />
  );

  // 1. RECTANGLE
  if (shape === "rectangle") {
    return (
      <div
        className={cn(
          "group relative flex h-full w-full items-center justify-center rounded-xl border text-center text-xs font-medium shadow-sm backdrop-blur-sm transition-all select-none px-2",
          selected
            ? "border-brand ring-2 ring-brand/40 shadow-brand/10 shadow-lg"
            : "border-border hover:border-border-hover hover:bg-surface"
        )}
        style={{
          backgroundColor: customColor,
        }}
      >
        {renderColorToolbar()}
        {renderResizer()}
        {renderHandles()}
        {renderLabel()}
      </div>
    );
  }

  // 2. CIRCLE
  if (shape === "circle") {
    return (
      <div
        className={cn(
          "group relative flex h-full w-full items-center justify-center rounded-full border aspect-square text-center text-xs font-medium shadow-sm backdrop-blur-sm transition-all select-none p-2",
          selected
            ? "border-brand ring-2 ring-brand/40 shadow-brand/10 shadow-lg"
            : "border-border hover:border-border-hover hover:bg-surface"
        )}
        style={{
          backgroundColor: customColor,
        }}
      >
        {renderColorToolbar()}
        {renderResizer()}
        {renderHandles()}
        {renderLabel()}
      </div>
    );
  }

  // 3. PILL
  if (shape === "pill") {
    return (
      <div
        className={cn(
          "group relative flex h-full w-full items-center justify-center rounded-full border text-center text-xs font-medium shadow-sm backdrop-blur-sm transition-all select-none px-3",
          selected
            ? "border-brand ring-2 ring-brand/40 shadow-brand/10 shadow-lg"
            : "border-border hover:border-border-hover hover:bg-surface"
        )}
        style={{
          backgroundColor: customColor,
        }}
      >
        {renderColorToolbar()}
        {renderResizer()}
        {renderHandles()}
        {renderLabel()}
      </div>
    );
  }

  // 4. DIAMOND
  if (shape === "diamond") {
    return (
      <div className="group relative flex h-full w-full items-center justify-center select-none">
        {renderColorToolbar()}
        {renderResizer()}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible transition-all"
        >
          <polygon
            points="50,2 98,50 50,98 2,50"
            fill={customColor}
            stroke={selected ? "var(--brand, #38bdf8)" : "var(--border, #27272a)"}
            strokeWidth={selected ? 2.5 : 1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              "transition-all",
              selected && "filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
            )}
          />
        </svg>

        {renderHandles()}
        <div className="relative z-10 flex h-full w-full items-center justify-center px-5 py-3 text-center">
          {renderLabel()}
        </div>
      </div>
    );
  }

  // 5. CYLINDER (Database)
  if (shape === "cylinder") {
    return (
      <div className="group relative flex h-full w-full items-center justify-center select-none">
        {renderColorToolbar()}
        {renderResizer()}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible transition-all"
        >
          {/* Main body with bottom curve */}
          <path
            d="M 2,16 L 2,84 C 2,94 98,94 98,84 L 98,16 Z"
            fill={customColor}
            stroke={selected ? "var(--brand, #38bdf8)" : "var(--border, #27272a)"}
            strokeWidth={selected ? 2.5 : 1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              "transition-all",
              selected && "filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
            )}
          />
          {/* Bottom decorative curve line */}
          <path
            d="M 2,84 C 2,94 98,94 98,84"
            fill="none"
            stroke={selected ? "var(--brand, #38bdf8)" : "var(--border, #27272a)"}
            strokeWidth={selected ? 2.5 : 1.5}
            vectorEffect="non-scaling-stroke"
          />
          {/* Top Ellipse */}
          <ellipse
            cx="50"
            cy="16"
            rx="48"
            ry="12"
            fill={customColor}
            stroke={selected ? "var(--brand, #38bdf8)" : "var(--border, #27272a)"}
            strokeWidth={selected ? 2.5 : 1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {renderHandles()}
        <div className="relative z-10 flex h-full w-full items-center justify-center pt-4 px-2.5 pb-2 text-center">
          {renderLabel()}
        </div>
      </div>
    );
  }

  // 6. HEXAGON
  if (shape === "hexagon") {
    return (
      <div className="group relative flex h-full w-full items-center justify-center select-none">
        {renderColorToolbar()}
        {renderResizer()}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible transition-all"
        >
          <polygon
            points="25,2 75,2 98,50 75,98 25,98 2,50"
            fill={customColor}
            stroke={selected ? "var(--brand, #38bdf8)" : "var(--border, #27272a)"}
            strokeWidth={selected ? 2.5 : 1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              "transition-all",
              selected && "filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
            )}
          />
        </svg>

        {renderHandles()}
        <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-2 text-center">
          {renderLabel()}
        </div>
      </div>
    );
  }

  // Fallback default
  return (
    <div
      className={cn(
        "group relative flex h-full w-full items-center justify-center rounded-xl border text-center text-xs font-medium shadow-sm backdrop-blur-sm transition-all select-none",
        selected
          ? "border-brand ring-2 ring-brand/40 shadow-brand/10 shadow-lg"
          : "border-border hover:border-border-hover hover:bg-surface"
      )}
      style={{
        backgroundColor: customColor,
      }}
    >
      {renderColorToolbar()}
      {renderResizer()}
      {renderHandles()}
      {renderLabel()}
    </div>
  );
}
