"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  MarkerType,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo, useUpdateMyPresence, useOther } from "@liveblocks/react";
import { Loader2 } from "lucide-react";
import { CanvasNodeComponent } from "@/components/canvas/canvas-node";
import { CanvasEdgeComponent } from "@/components/canvas/canvas-edge";
import { ShapePanel } from "@/components/canvas/shape-panel";
import { CanvasControlBar } from "@/components/canvas/canvas-control-bar";
import {
  GhostPreview,
  GhostDragPreviewState,
} from "@/components/canvas/ghost-preview";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  CanvasNode,
  CanvasEdge,
  CanvasNodeShape,
  SHAPE_DEFINITIONS,
  DEFAULT_NODE_COLOR,
} from "@/types/canvas";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import {
  useCanvasAutosave,
  type SaveStatus,
} from "@/hooks/use-canvas-autosave";

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeComponent,
};

const edgeTypes: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeComponent,
};

function CustomCanvasCursor({ connectionId }: { userId: string; connectionId: number }) {
  const info = useOther(connectionId, (other) => other.info);
  const thinking = useOther(connectionId, (other) => other.presence?.thinking);
  const name = info?.name || "Collaborator";
  const color = info?.color || "#38bdf8";

  return (
    <div className="relative pointer-events-none select-none z-50">
      {/* Colored Pointer SVG */}
      <svg
        className="h-5 w-5 drop-shadow-md"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
        />
      </svg>

      {/* Name Badge */}
      <div
        className="absolute left-3.5 top-3.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-md whitespace-nowrap flex items-center gap-1"
        style={{ backgroundColor: color }}
      >
        {thinking && (
          <Loader2 className="h-2.5 w-2.5 animate-spin text-white shrink-0" />
        )}
        <span>{name}</span>
      </div>
    </div>
  );
}

export interface CanvasProps {
  roomId?: string;
  isTemplatesOpen?: boolean;
  onOpenTemplatesChange?: (open: boolean) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  saveTrigger?: number;
}

function CanvasContent({
  roomId,
  isTemplatesOpen = false,
  onOpenTemplatesChange,
  onSaveStatusChange,
  saveTrigger,
}: CanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    });

  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition } = reactFlowInstance;
  const undo = useUndo();
  const redo = useRedo();
  const updateMyPresence = useUpdateMyPresence();

  const hasCheckedSavedStateRef = React.useRef(false);

  // Initial load: check if room is empty and fetch saved state from blob
  React.useEffect(() => {
    if (!roomId || hasCheckedSavedStateRef.current) return;

    // If room already has nodes or edges from active multiplayer session, skip load
    if (nodes.length > 0 || edges.length > 0) {
      hasCheckedSavedStateRef.current = true;
      return;
    }

    let isMounted = true;
    async function loadSavedState() {
      try {
        const res = await fetch(`/api/projects/${roomId}/canvas`);
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted) return;

        if (
          Array.isArray(data.nodes) &&
          data.nodes.length > 0 &&
          nodes.length === 0
        ) {
          onNodesChange(
            data.nodes.map((node: CanvasNode) => ({
              type: "add" as const,
              item: node,
            }))
          );
          if (Array.isArray(data.edges) && data.edges.length > 0) {
            onEdgesChange(
              data.edges.map((edge: CanvasEdge) => ({
                type: "add" as const,
                item: edge,
              }))
            );
          }
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 });
          }, 100);
        }
      } catch (err) {
        console.error("[CANVAS_INITIAL_LOAD_ERROR]", err);
      } finally {
        hasCheckedSavedStateRef.current = true;
      }
    }

    loadSavedState();

    return () => {
      isMounted = false;
    };
  }, [
    roomId,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    reactFlowInstance,
  ]);

  // Debounced Autosave Hook
  const { saveNow } = useCanvasAutosave({
    projectId: roomId,
    nodes,
    edges,
    enabled: true,
    onSaveStatusChange,
  });

  // Manual save trigger from navbar
  React.useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      saveNow();
    }
  }, [saveTrigger, saveNow]);

  const handleCanvasMouseMove = React.useCallback(
    (event: React.MouseEvent) => {
      const pos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: pos });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const handleCanvasMouseLeave = React.useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  useKeyboardShortcuts({
    reactFlowInstance,
    undo,
    redo,
  });

  const handleImportTemplate = React.useCallback(
    (template: CanvasTemplate) => {
      // 1. Clear existing nodes and edges first
      if (nodes.length > 0 || edges.length > 0) {
        onDelete({ nodes, edges });
      }

      // 2. Add template nodes and edges
      if (template.nodes.length > 0) {
        onNodesChange(
          template.nodes.map((node) => ({
            type: "add" as const,
            item: node,
          }))
        );
      }

      if (template.edges.length > 0) {
        onEdgesChange(
          template.edges.map((edge) => ({
            type: "add" as const,
            item: edge,
          }))
        );
      }

      // 3. Close modal
      onOpenTemplatesChange?.(false);

      // 4. Fit view after template is loaded into canvas
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 50);
    },
    [
      nodes,
      edges,
      onDelete,
      onNodesChange,
      onEdgesChange,
      onOpenTemplatesChange,
      reactFlowInstance,
    ]
  );

  const counterRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [activeDraggedShape, setActiveDraggedShape] =
    React.useState<CanvasNodeShape | null>(null);
  const [dragPreview, setDragPreview] =
    React.useState<GhostDragPreviewState | null>(null);

  // Clean up drag preview on global dragend/cancel
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setActiveDraggedShape(null);
      setDragPreview(null);
    };

    window.addEventListener("dragend", handleGlobalDragEnd);
    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
    };
  }, []);

  const onDragOver = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      let shape = activeDraggedShape;
      if (!shape) {
        try {
          const raw =
            event.dataTransfer.getData("application/reactflow") ||
            event.dataTransfer.getData("text/plain");
          if (raw) {
            const parsed = JSON.parse(raw);
            shape = parsed.shape;
          }
        } catch {
          // ignore parsing error during dragover
        }
      }

      if (shape && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const shapeDef = SHAPE_DEFINITIONS[shape];
        const width = shapeDef?.defaultWidth ?? 140;
        const height = shapeDef?.defaultHeight ?? 70;

        setDragPreview({
          shape,
          width,
          height,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    [activeDraggedShape]
  );

  const onDragLeave = React.useCallback(
    (event: React.DragEvent) => {
      // If leaving container boundaries
      if (
        containerRef.current &&
        !containerRef.current.contains(event.relatedTarget as Node)
      ) {
        setDragPreview(null);
      }
    },
    []
  );

  const handleAddShape = React.useCallback(
    (shape: CanvasNodeShape, clientX?: number, clientY?: number) => {
      const shapeDef = SHAPE_DEFINITIONS[shape];
      const width = shapeDef?.defaultWidth ?? 140;
      const height = shapeDef?.defaultHeight ?? 70;

      let position: { x: number; y: number };
      if (typeof clientX === "number" && typeof clientY === "number") {
        position = screenToFlowPosition({ x: clientX, y: clientY });
      } else {
        const rect = containerRef.current?.getBoundingClientRect();
        const centerScreenX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const centerScreenY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        const offset = (counterRef.current % 5) * 15;
        position = screenToFlowPosition({
          x: centerScreenX + offset,
          y: centerScreenY + offset,
        });
      }

      counterRef.current += 1;
      const nodeId = `${shape}-${Date.now()}-${counterRef.current}`;

      const newNode: CanvasNode = {
        id: nodeId,
        type: CANVAS_NODE_TYPE,
        position: {
          x: position.x - width / 2,
          y: position.y - height / 2,
        },
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          textColor: DEFAULT_NODE_COLOR.text,
          shape,
        },
        style: {
          width,
          height,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragPreview(null);
      setActiveDraggedShape(null);

      const raw =
        event.dataTransfer.getData("application/reactflow") ||
        event.dataTransfer.getData("text/plain");

      if (!raw) return;

      try {
        const payload = JSON.parse(raw) as {
          shape: CanvasNodeShape;
          defaultWidth?: number;
          defaultHeight?: number;
        };

        handleAddShape(payload.shape, event.clientX, event.clientY);
      } catch (err) {
        console.error("[CANVAS_DROP_ERROR]", err);
      }
    },
    [handleAddShape]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-base overflow-hidden select-none touch-none"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: CANVAS_EDGE_TYPE,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        }}
        connectionMode={ConnectionMode.Loose}
        fitView
        panOnScroll={false}
        panOnDrag={[1, 2]}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        autoPanOnNodeDrag={true}
        autoPanOnConnect={true}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        className="ghost-canvas"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#3f3f46"
          className="bg-base"
        />
        <Cursors components={{ Cursor: CustomCanvasCursor }} />
      </ReactFlow>

      {/* Live Ghost Drag Preview */}
      <GhostPreview preview={dragPreview} />

      {/* Floating Bottom-Left Canvas Control Bar */}
      <CanvasControlBar />

      {/* Floating Bottom Shape Toolbar */}
      <ShapePanel
        onDragStartShape={(shape) => setActiveDraggedShape(shape)}
        onDragEnd={() => {
          setActiveDraggedShape(null);
          setDragPreview(null);
        }}
        onAddShape={(shape) => handleAddShape(shape)}
        onTouchDragMove={(shape, clientX, clientY) => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const shapeDef = SHAPE_DEFINITIONS[shape];
            const width = shapeDef?.defaultWidth ?? 140;
            const height = shapeDef?.defaultHeight ?? 70;
            setDragPreview({
              shape,
              width,
              height,
              x: clientX - rect.left,
              y: clientY - rect.top,
            });
          }
        }}
        onTouchDragEnd={(shape, clientX, clientY) => {
          setDragPreview(null);
          setActiveDraggedShape(null);
          handleAddShape(shape, clientX, clientY);
        }}
      />

      {/* Starter Templates Modal */}
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onOpenChange={(open) => onOpenTemplatesChange?.(open)}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} />
    </ReactFlowProvider>
  );
}
