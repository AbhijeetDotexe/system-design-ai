import dagre from "dagre";
import { DiagramNode, DiagramEdge } from "@systemcraft/diagram-schema";

export interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeSpacing?: number;
  rankSpacing?: number;
}

/**
 * Automatically calculates optimal positions for nodes and routed paths for edges
 * using the Dagre hierarchical graph layout engine.
 */
export function applyDagreLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  options: LayoutOptions = {}
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const g = new dagre.graphlib.Graph();

  const direction = options.direction || "LR";
  const nodeSpacing = options.nodeSpacing || 60;
  const rankSpacing = options.rankSpacing || 90;

  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 80,
    marginy: 80
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  for (const node of nodes) {
    const width = node.width || 180;
    const height = node.height || 85;
    g.setNode(node.id, { width, height });
  }

  // Add edges
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  // Read updated positions
  const positionedNodes: DiagramNode[] = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    // Dagre uses center point, convert to top-left corner
    const width = node.width || 180;
    const height = node.height || 85;
    const x = Math.round(dagreNode.x - width / 2);
    const y = Math.round(dagreNode.y - height / 2);

    return {
      ...node,
      position: { x, y },
      width,
      height
    };
  });

  return {
    nodes: positionedNodes,
    edges
  };
}
