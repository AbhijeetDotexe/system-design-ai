import { describe, it, expect } from "vitest";
import { applyDagreLayout } from "../layout/dagre-layout.js";
import { DiagramNode, DiagramEdge } from "@systemcraft/diagram-schema";

describe("applyDagreLayout", () => {
  it("should calculate non-overlapping coordinates for nodes", () => {
    const nodes: DiagramNode[] = [
      { id: "client", type: "client", label: "Client", position: { x: 0, y: 0 }, width: 180, height: 80 },
      { id: "lb", type: "load_balancer", label: "Load Balancer", position: { x: 0, y: 0 }, width: 180, height: 80 },
      { id: "api", type: "service", label: "API Gateway", position: { x: 0, y: 0 }, width: 180, height: 80 }
    ];

    const edges: DiagramEdge[] = [
      { id: "e1", source: "client", target: "lb" },
      { id: "e2", source: "lb", target: "api" }
    ];

    const result = applyDagreLayout(nodes, edges, { direction: "LR" });

    expect(result.nodes.length).toBe(3);
    const clientNode = result.nodes.find((n) => n.id === "client")!;
    const lbNode = result.nodes.find((n) => n.id === "lb")!;
    const apiNode = result.nodes.find((n) => n.id === "api")!;

    expect(clientNode.position.x).toBeLessThan(lbNode.position.x);
    expect(lbNode.position.x).toBeLessThan(apiNode.position.x);
  });
});
