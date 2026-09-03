import { MarkerType } from "@xyflow/react";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  CanvasNode,
  CanvasEdge,
  CanvasNodeShape,
  NodeColorOption,
  NODE_COLORS,
  SHAPE_DEFINITIONS,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// Helper function to create template nodes concisely
function createTemplateNode(
  id: string,
  shape: CanvasNodeShape,
  label: string,
  colorOption: NodeColorOption,
  position: { x: number; y: number },
  customSize?: { width: number; height: number }
): CanvasNode {
  const shapeDef = SHAPE_DEFINITIONS[shape];
  const width = customSize?.width ?? shapeDef?.defaultWidth ?? 140;
  const height = customSize?.height ?? shapeDef?.defaultHeight ?? 70;

  return {
    id,
    type: CANVAS_NODE_TYPE,
    position,
    data: {
      label,
      shape,
      color: colorOption.fill,
      textColor: colorOption.text,
    },
    style: {
      width,
      height,
    },
  };
}

// Helper function to create template edges concisely
function createTemplateEdge(
  id: string,
  source: string,
  target: string,
  label?: string
): CanvasEdge {
  return {
    id,
    source,
    target,
    type: CANVAS_EDGE_TYPE,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#94a3b8",
    },
    data: {
      label,
    },
  };
}

// Color palette lookups for readability
const blueColor = NODE_COLORS.find((c) => c.id === "blue") || NODE_COLORS[1];
const purpleColor = NODE_COLORS.find((c) => c.id === "purple") || NODE_COLORS[2];
const orangeColor = NODE_COLORS.find((c) => c.id === "orange") || NODE_COLORS[3];
const redColor = NODE_COLORS.find((c) => c.id === "red") || NODE_COLORS[4];
const pinkColor = NODE_COLORS.find((c) => c.id === "pink") || NODE_COLORS[5];
const greenColor = NODE_COLORS.find((c) => c.id === "green") || NODE_COLORS[6];
const tealColor = NODE_COLORS.find((c) => c.id === "teal") || NODE_COLORS[7];

// Pre-built Starter Templates
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description:
      "Scalable backend architecture featuring an API gateway distributing traffic to decoupled services with dedicated databases.",
    nodes: [
      createTemplateNode("client", "pill", "Client Apps", blueColor, { x: 50, y: 170 }),
      createTemplateNode("gateway", "rectangle", "API Gateway", orangeColor, { x: 260, y: 163 }),
      createTemplateNode("auth-service", "rectangle", "Auth Service", purpleColor, { x: 480, y: 50 }),
      createTemplateNode("order-service", "rectangle", "Order Service", blueColor, { x: 480, y: 163 }),
      createTemplateNode("payment-service", "rectangle", "Payment Service", tealColor, { x: 480, y: 280 }),
      createTemplateNode("auth-db", "cylinder", "Auth DB", purpleColor, { x: 700, y: 40 }),
      createTemplateNode("order-db", "cylinder", "Order DB", blueColor, { x: 700, y: 153 }),
      createTemplateNode("payment-db", "cylinder", "Payment DB", tealColor, { x: 700, y: 270 }),
    ],
    edges: [
      createTemplateEdge("e-client-gw", "client", "gateway", "HTTPS"),
      createTemplateEdge("e-gw-auth", "gateway", "auth-service", "/auth"),
      createTemplateEdge("e-gw-order", "gateway", "order-service", "/orders"),
      createTemplateEdge("e-gw-payment", "gateway", "payment-service", "/pay"),
      createTemplateEdge("e-auth-db", "auth-service", "auth-db"),
      createTemplateEdge("e-order-db", "order-service", "order-db"),
      createTemplateEdge("e-payment-db", "payment-service", "payment-db"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Deployment Pipeline",
    description:
      "Automated DevOps workflow with Git triggers, parallel test and security validation stages, container build, and Kubernetes deployment.",
    nodes: [
      createTemplateNode("git-repo", "rectangle", "Git Repository", orangeColor, { x: 50, y: 130 }),
      createTemplateNode("webhook", "circle", "Webhook", blueColor, { x: 250, y: 120 }),
      createTemplateNode("ci-runner", "rectangle", "CI Runner", purpleColor, { x: 400, y: 130 }),
      createTemplateNode("unit-tests", "rectangle", "Unit & E2E Tests", tealColor, { x: 610, y: 40 }),
      createTemplateNode("security-scan", "diamond", "Security Scan", redColor, { x: 625, y: 190 }),
      createTemplateNode("docker-build", "hexagon", "Docker Build", blueColor, { x: 820, y: 120 }),
      createTemplateNode("registry", "cylinder", "Container Registry", greenColor, { x: 1010, y: 40 }),
      createTemplateNode("k8s-cluster", "rectangle", "K8s Production", greenColor, { x: 990, y: 190 }),
    ],
    edges: [
      createTemplateEdge("e-git-hook", "git-repo", "webhook", "Push / PR"),
      createTemplateEdge("e-hook-ci", "webhook", "ci-runner", "Trigger"),
      createTemplateEdge("e-ci-test", "ci-runner", "unit-tests", "Run"),
      createTemplateEdge("e-ci-sec", "ci-runner", "security-scan", "Audit"),
      createTemplateEdge("e-test-docker", "unit-tests", "docker-build", "Pass"),
      createTemplateEdge("e-sec-docker", "security-scan", "docker-build", "Pass"),
      createTemplateEdge("e-docker-reg", "docker-build", "registry", "Push"),
      createTemplateEdge("e-reg-k8s", "registry", "k8s-cluster", "Deploy"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven Stream Architecture",
    description:
      "High-throughput asynchronous messaging pattern using Kafka event streaming, stream consumer workers, and analytical data storage.",
    nodes: [
      createTemplateNode("web-producer", "rectangle", "Web Producer", blueColor, { x: 50, y: 60 }),
      createTemplateNode("iot-producer", "rectangle", "IoT Ingest Stream", purpleColor, { x: 50, y: 220 }),
      createTemplateNode("event-bus", "hexagon", "Kafka / Event Bus", orangeColor, { x: 280, y: 130 }),
      createTemplateNode("analytics-worker", "rectangle", "Analytics Worker", tealColor, { x: 480, y: 50 }),
      createTemplateNode("notify-worker", "rectangle", "Notification Worker", pinkColor, { x: 480, y: 230 }),
      createTemplateNode("data-lake", "cylinder", "Analytics Lake (S3)", tealColor, { x: 700, y: 40 }),
      createTemplateNode("push-gateway", "pill", "Push Gateway", pinkColor, { x: 680, y: 237 }),
    ],
    edges: [
      createTemplateEdge("e-web-bus", "web-producer", "event-bus", "Publish"),
      createTemplateEdge("e-iot-bus", "iot-producer", "event-bus", "Telemetry"),
      createTemplateEdge("e-bus-analytics", "event-bus", "analytics-worker", "Subscribe"),
      createTemplateEdge("e-bus-notify", "event-bus", "notify-worker", "Subscribe"),
      createTemplateEdge("e-analytics-lake", "analytics-worker", "data-lake", "Write"),
      createTemplateEdge("e-notify-push", "notify-worker", "push-gateway", "Dispatch"),
    ],
  },
  {
    id: "serverless-ai",
    name: "Serverless AI & Vector Pipeline",
    description:
      "Modern AI inference pipeline with edge routing, vector embeddings search, LLM completion engine, and fast cache layer.",
    nodes: [
      createTemplateNode("user-app", "pill", "User Client", blueColor, { x: 50, y: 155 }),
      createTemplateNode("edge-api", "rectangle", "Edge API Route", orangeColor, { x: 260, y: 148 }),
      createTemplateNode("embed-svc", "rectangle", "Embedding Model", purpleColor, { x: 470, y: 50 }),
      createTemplateNode("vector-db", "cylinder", "Vector DB (Pinecone)", purpleColor, { x: 680, y: 40 }),
      createTemplateNode("llm-engine", "hexagon", "LLM Engine", pinkColor, { x: 675, y: 180 }),
      createTemplateNode("cache", "rectangle", "Redis Cache", greenColor, { x: 470, y: 250 }),
    ],
    edges: [
      createTemplateEdge("e-app-edge", "user-app", "edge-api", "Query"),
      createTemplateEdge("e-edge-embed", "edge-api", "embed-svc", "Text"),
      createTemplateEdge("e-embed-vector", "embed-svc", "vector-db", "Vector search"),
      createTemplateEdge("e-edge-llm", "edge-api", "llm-engine", "Context"),
      createTemplateEdge("e-vector-llm", "vector-db", "llm-engine", "Top matches"),
      createTemplateEdge("e-edge-cache", "edge-api", "cache", "Lookup / Set"),
    ],
  },
];
