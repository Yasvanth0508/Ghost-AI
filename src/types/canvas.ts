import type { Node, Edge } from "@xyflow/react";

export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export interface ShapeDefinition {
  shape: CanvasNodeShape;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const SHAPE_DEFINITIONS: Record<CanvasNodeShape, ShapeDefinition> = {
  rectangle: {
    shape: "rectangle",
    label: "Rectangle",
    defaultWidth: 160,
    defaultHeight: 72,
  },
  diamond: {
    shape: "diamond",
    label: "Diamond",
    defaultWidth: 130,
    defaultHeight: 130,
  },
  circle: {
    shape: "circle",
    label: "Circle",
    defaultWidth: 100,
    defaultHeight: 100,
  },
  pill: {
    shape: "pill",
    label: "Pill",
    defaultWidth: 160,
    defaultHeight: 56,
  },
  cylinder: {
    shape: "cylinder",
    label: "Cylinder",
    defaultWidth: 130,
    defaultHeight: 90,
  },
  hexagon: {
    shape: "hexagon",
    label: "Hexagon",
    defaultWidth: 130,
    defaultHeight: 90,
  },
};

export interface NodeColorOption {
  id: string;
  name: string;
  fill: string;
  text: string;
}

export const NODE_COLORS: NodeColorOption[] = [
  { id: "neutral", name: "Neutral", fill: "#1F1F1F", text: "#EDEDED" },
  { id: "blue", name: "Blue", fill: "#10233D", text: "#52A8FF" },
  { id: "purple", name: "Purple", fill: "#2E1938", text: "#BF7AF0" },
  { id: "orange", name: "Orange", fill: "#331B00", text: "#FF990A" },
  { id: "red", name: "Red", fill: "#3C1618", text: "#FF6166" },
  { id: "pink", name: "Pink", fill: "#3A1726", text: "#F75F8F" },
  { id: "green", name: "Green", fill: "#0F2E18", text: "#62C073" },
  { id: "teal", name: "Teal", fill: "#062822", text: "#0AC7B4" },
];

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  textColor?: string;
  shape?: CanvasNodeShape | string;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

export type CanvasNodeType = typeof CANVAS_NODE_TYPE;
export type CanvasEdgeType = typeof CANVAS_EDGE_TYPE;

export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>;
export type CanvasEdge = Edge<CanvasEdgeData, CanvasEdgeType>;
