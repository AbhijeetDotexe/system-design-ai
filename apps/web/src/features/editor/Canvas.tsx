import React, { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore, ToolType } from "../../stores/editorStore";
import { DiagramNode, DiagramEdge } from "@systemcraft/diagram-schema";
import { getNodeStyle } from "./nodeConfig";
import { 
  Server, Database, Layers, Network, ShieldAlert, Cpu, 
  GitFork, HardDrive, Zap, Globe, Smartphone, Monitor, KeyRound, Activity, Box,
  ArrowRight, Copy, Trash2, ArrowUp, ArrowDown
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="w-4 h-4 text-blue-400" />,
  Globe: <Globe className="w-4 h-4 text-cyan-400" />,
  Smartphone: <Smartphone className="w-4 h-4 text-sky-400" />,
  Zap: <Zap className="w-4 h-4 text-amber-400" />,
  Network: <Network className="w-4 h-4 text-indigo-400" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4 text-violet-400" />,
  Server: <Server className="w-4 h-4 text-emerald-400" />,
  Cpu: <Cpu className="w-4 h-4 text-teal-400" />,
  Boxes: <Box className="w-4 h-4 text-blue-500" />,
  Database: <Database className="w-4 h-4 text-cyan-400" />,
  Layers: <Layers className="w-4 h-4 text-red-500" />,
  HardDrive: <HardDrive className="w-4 h-4 text-orange-400" />,
  GitFork: <GitFork className="w-4 h-4 text-rose-400" />,
  MessageSquare: <GitFork className="w-4 h-4 text-amber-500" />,
  KeyRound: <KeyRound className="w-4 h-4 text-purple-400" />,
  Activity: <Activity className="w-4 h-4 text-pink-400" />,
  Box: <Box className="w-4 h-4 text-gray-400" />
};

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    document,
    selectedNodeIds,
    selectedEdgeId,
    connectingNodeId,
    connectingAnchor,
    activeTool,
    theme,
    selectNode,
    selectEdge,
    clearSelection,
    updateNodePosition,
    resizeNode,
    addNode,
    addEdge,
    setConnectingNodeId,
    setActiveTool,
    setViewport,
    updateZIndex,
    deleteSelected,
    duplicateSelected,
    pushHistory
  } = useEditorStore();

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing state
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const [initialBounds, setInitialBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [resizeStartMouse, setResizeStartMouse] = useState<{ x: number; y: number } | null>(null);
  const [liveDimensions, setLiveDimensions] = useState<{ width: number; height: number } | null>(null);

  // Shape creation by drag
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [pencilPoints, setPencilPoints] = useState<{ x: number; y: number }[]>([]);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const { x: vpX, y: vpY, zoom } = document.viewport;

  // Wheel zoom and pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.0015;
        const newZoom = Math.min(2.5, Math.max(0.2, +(zoom + zoomDelta).toFixed(2)));
        setViewport({ zoom: newZoom });
      } else {
        setViewport({
          x: vpX - e.deltaX,
          y: vpY - e.deltaY
        });
      }
    },
    [vpX, vpY, zoom, setViewport]
  );

  // Convert client coordinates to canvas coordinate space
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - vpX) / zoom,
        y: (clientY - rect.top - vpY) / zoom
      };
    },
    [vpX, vpY, zoom]
  );

  // Background pointer down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);

    // If Hand tool or middle mouse: start panning
    if (activeTool === "hand" || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - vpX, y: e.clientY - vpY });
      return;
    }

    // Free shape creation tool active
    if (
      ["rectangle", "rounded_rectangle", "ellipse", "diamond", "text", "pencil"].includes(activeTool)
    ) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setIsDrawingShape(true);
      setDrawStart({ x, y });
      setDrawCurrent({ x, y });
      if (activeTool === "pencil") {
        setPencilPoints([{ x, y }]);
      }
      return;
    }

    // Default select tool on empty canvas: deselect
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg") {
      clearSelection();
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - vpX, y: e.clientY - vpY });
      }
    }
  };

  // Mouse move handler for pan, drag, resize, and draw
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isDrawingShape && drawStart) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setDrawCurrent({ x, y });
      if (activeTool === "pencil") {
        setPencilPoints((prev) => [...prev, { x, y }]);
      }
      return;
    }

    if (resizingNodeId && initialBounds && resizeStartMouse && activeHandle) {
      const currentMouse = screenToCanvas(e.clientX, e.clientY);
      const dx = currentMouse.x - resizeStartMouse.x;
      const dy = currentMouse.y - resizeStartMouse.y;

      let newX = initialBounds.x;
      let newY = initialBounds.y;
      let newW = initialBounds.width;
      let newH = initialBounds.height;

      const minW = 40;
      const minH = 30;

      // Handle calculations
      if (activeHandle.includes("e")) {
        newW = Math.max(minW, initialBounds.width + dx);
      }
      if (activeHandle.includes("s")) {
        newH = Math.max(minH, initialBounds.height + dy);
      }
      if (activeHandle.includes("w")) {
        const potentialW = initialBounds.width - dx;
        if (potentialW >= minW) {
          newW = potentialW;
          newX = initialBounds.x + dx;
        } else {
          newW = minW;
          newX = initialBounds.x + initialBounds.width - minW;
        }
      }
      if (activeHandle.includes("n")) {
        const potentialH = initialBounds.height - dy;
        if (potentialH >= minH) {
          newH = potentialH;
          newY = initialBounds.y + dy;
        } else {
          newH = minH;
          newY = initialBounds.y + initialBounds.height - minH;
        }
      }

      // Preserve aspect ratio if circle
      const targetNode = document.nodes.find((n) => n.id === resizingNodeId);
      if (targetNode?.type === "circle" || e.shiftKey) {
        const maxDim = Math.max(newW, newH);
        newW = maxDim;
        newH = maxDim;
      }

      newW = Math.round(newW);
      newH = Math.round(newH);
      newX = Math.round(newX);
      newY = Math.round(newY);

      setLiveDimensions({ width: newW, height: newH });
      resizeNode(resizingNodeId, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    if (draggingNodeId) {
      const currentMouse = screenToCanvas(e.clientX, e.clientY);
      const nextX = Math.round(currentMouse.x - dragOffset.x);
      const nextY = Math.round(currentMouse.y - dragOffset.y);
      updateNodePosition(draggingNodeId, nextX, nextY);
    }
  };

  // Mouse up
  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);

    if (isDrawingShape && drawStart && drawCurrent) {
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.max(40, Math.abs(drawCurrent.x - drawStart.x));
      const height = Math.max(30, Math.abs(drawCurrent.y - drawStart.y));

      if (activeTool === "pencil") {
        addNode({
          type: "freehand",
          label: "",
          position: { x, y },
          width,
          height,
          style: {
            points: pencilPoints.map((p) => ({ x: p.x - x, y: p.y - y })),
            borderColor: theme === "light" ? "#4f46e5" : "#818cf8",
            borderWidth: 2
          }
        });
      } else {
        const defaultLabels: Record<string, string> = {
          rectangle: "Rectangle",
          rounded_rectangle: "Container",
          ellipse: "Process",
          diamond: "Decision",
          text: "Text Note"
        };

        addNode({
          type: activeTool as any,
          label: defaultLabels[activeTool] || "",
          position: { x: Math.round(x), y: Math.round(y) },
          width: Math.round(width),
          height: Math.round(height),
          style: {
            textAlign: "center",
            fontSize: activeTool === "text" ? 16 : 14,
            borderRadius: activeTool === "rounded_rectangle" ? 16 : 6,
            backgroundColor:
              activeTool === "text"
                ? "transparent"
                : theme === "light"
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(30, 41, 59, 0.7)",
            borderColor: theme === "light" ? "#d7dae0" : "rgba(255, 255, 255, 0.15)"
          }
        });
      }

      setIsDrawingShape(false);
      setDrawStart(null);
      setDrawCurrent(null);
      setPencilPoints([]);
      setActiveTool("select");
      return;
    }

    if (resizingNodeId) {
      setResizingNodeId(null);
      setActiveHandle(null);
      setInitialBounds(null);
      setResizeStartMouse(null);
      setLiveDimensions(null);
      pushHistory();
    }

    if (draggingNodeId) {
      setDraggingNodeId(null);
      pushHistory();
    }
  };

  // Drag and drop from component library
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeDataStr = e.dataTransfer.getData("application/systemcraft-node");
    if (!nodeDataStr) return;

    try {
      const nodeData = JSON.parse(nodeDataStr);
      const { x, y } = screenToCanvas(e.clientX, e.clientY);

      addNode({
        type: nodeData.type,
        label: nodeData.label,
        description: nodeData.description,
        tech: nodeData.tech,
        position: { x: Math.round(x - 90), y: Math.round(y - 40) }
      });
    } catch (err) {
      console.error("Drop node error:", err);
    }
  };

  // Select node & start dragging
  const handleNodeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    e.stopPropagation();

    if (connectingNodeId) {
      if (connectingNodeId !== node.id) {
        addEdge(connectingNodeId, node.id, "calls");
      }
      setConnectingNodeId(null);
      return;
    }

    if (e.button === 2) {
      // Right-click context menu
      selectNode(node.id, false);
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
      return;
    }

    const isMulti = e.shiftKey || e.metaKey || e.ctrlKey;
    selectNode(node.id, isMulti);

    const mousePos = screenToCanvas(e.clientX, e.clientY);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: mousePos.x - node.position.x,
      y: mousePos.y - node.position.y
    });
  };

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent, node: DiagramNode, handle: HandlePosition) => {
    e.stopPropagation();
    e.preventDefault();

    setResizingNodeId(node.id);
    setActiveHandle(handle);
    setInitialBounds({
      x: node.position.x,
      y: node.position.y,
      width: node.width || 180,
      height: node.height || 85
    });
    setResizeStartMouse(screenToCanvas(e.clientX, e.clientY));
    setLiveDimensions({ width: node.width || 180, height: node.height || 85 });
  };

  // Calculate connection anchor coordinate
  const getNodeAnchor = (node: DiagramNode, anchor?: string | null) => {
    const w = node.width || 180;
    const h = node.height || 85;
    const x = node.position.x;
    const y = node.position.y;

    switch (anchor) {
      case "top":
        return { x: x + w / 2, y };
      case "bottom":
        return { x: x + w / 2, y: y + h };
      case "left":
        return { x, y: y + h / 2 };
      case "right":
        return { x: x + w, y: y + h / 2 };
      default:
        return { x: x + w / 2, y: y + h / 2 };
    }
  };

  return (
    <div
      ref={containerRef}
      id="canvas-viewport"
      className={`relative w-full h-full overflow-hidden canvas-grid-pattern cursor-default select-none ${
        activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Transformed Stage Container */}
      <div
        style={{
          transform: `translate(${vpX}px, ${vpY}px) scale(${zoom})`,
          transformOrigin: "0 0"
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Connectors Layer */}
        <svg className="absolute overflow-visible w-[50000px] h-[50000px] pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={theme === "light" ? "#4f46e5" : "#818cf8"} />
            </marker>
            <marker
              id="arrowhead-selected"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#ec4899" />
            </marker>
          </defs>

          {document.edges.map((edge) => {
            const sourceNode = document.nodes.find((n) => n.id === edge.source);
            const targetNode = document.nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sW = sourceNode.width || 180;
            const sH = sourceNode.height || 85;
            const tW = targetNode.width || 180;
            const tH = targetNode.height || 85;

            const sCenterX = sourceNode.position.x + sW / 2;
            const sCenterY = sourceNode.position.y + sH / 2;
            const tCenterX = targetNode.position.x + tW / 2;
            const tCenterY = targetNode.position.y + tH / 2;

            let startX = sCenterX;
            let startY = sCenterY;
            let endX = tCenterX;
            let endY = tCenterY;

            // Route from closest borders
            if (sCenterX < tCenterX - 40) {
              startX = sourceNode.position.x + sW;
              endX = targetNode.position.x;
            } else if (sCenterX > tCenterX + 40) {
              startX = sourceNode.position.x;
              endX = targetNode.position.x + tW;
            } else if (sCenterY < tCenterY) {
              startY = sourceNode.position.y + sH;
              endY = targetNode.position.y;
            } else {
              startY = sourceNode.position.y;
              endY = targetNode.position.y + tH;
            }

            const isSelected = selectedEdgeId === edge.id;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const dx = Math.abs(endX - startX) * 0.5;
            const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

            return (
              <g
                key={edge.id}
                className="pointer-events-auto cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  selectEdge(edge.id);
                }}
              >
                <path d={pathD} stroke="transparent" strokeWidth="24" fill="none" />
                <path
                  d={pathD}
                  stroke={isSelected ? "#ec4899" : theme === "light" ? "#4f46e5" : "#818cf8"}
                  strokeWidth={isSelected ? "3" : "2"}
                  strokeDasharray={edge.type === "dashed" ? "5,5" : undefined}
                  fill="none"
                  markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                  className="transition-colors group-hover:stroke-indigo-400"
                />
                {edge.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-50"
                      y="-11"
                      width="100"
                      height="22"
                      rx="4"
                      fill={theme === "light" ? "#ffffff" : "#1e2230"}
                      stroke={isSelected ? "#ec4899" : theme === "light" ? "#d7dae0" : "#374151"}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      className={`text-[11px] font-mono tracking-tight select-none pointer-events-none ${
                        theme === "light" ? "fill-slate-700" : "fill-gray-300"
                      }`}
                    >
                      {edge.label.length > 18 ? `${edge.label.slice(0, 16)}…` : edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {document.nodes.map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          const isConnectingSource = connectingNodeId === node.id;
          const isResizingThis = resizingNodeId === node.id;
          const config = getNodeStyle(node.type);
          const icon = ICON_MAP[config.icon] || ICON_MAP.Server;

          const isArchitecture = ![
            "rectangle",
            "rounded_rectangle",
            "ellipse",
            "circle",
            "diamond",
            "text",
            "freehand"
          ].includes(node.type);

          const textAlignClass = 
            node.style?.textAlign === "left"
              ? "text-left items-start"
              : node.style?.textAlign === "right"
              ? "text-right items-end"
              : "text-center items-center justify-center";

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              className={`absolute pointer-events-auto transition-shadow group select-none shadow-md ${
                isSelected
                  ? "ring-2 ring-indigo-500 shadow-indigo-500/20"
                  : isConnectingSource
                  ? "ring-2 ring-amber-400 animate-pulse"
                  : "hover:shadow-lg"
              }`}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: `${node.width || 180}px`,
                height: `${node.height || 85}px`,
                borderRadius:
                  node.type === "ellipse" || node.type === "circle"
                    ? "9999px"
                    : node.type === "rounded_rectangle"
                    ? `${node.style?.borderRadius || 16}px`
                    : node.type === "text"
                    ? "0px"
                    : `${node.style?.borderRadius || 12}px`,
                backgroundColor:
                  node.style?.backgroundColor ||
                  (isArchitecture
                    ? theme === "light"
                      ? "rgba(255, 255, 255, 0.95)"
                      : config.bgColor || "rgba(15, 23, 42, 0.85)"
                    : node.type === "text"
                    ? "transparent"
                    : theme === "light"
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(30, 41, 59, 0.75)"),
                borderWidth: node.type === "text" ? 0 : `${node.style?.borderWidth || 1}px`,
                borderColor:
                  node.style?.borderColor ||
                  (isSelected
                    ? "#6366f1"
                    : theme === "light"
                    ? "#d7dae0"
                    : "rgba(255, 255, 255, 0.12)"),
                opacity: (node.style?.opacity ?? 100) / 100,
                transform: node.type === "diamond" ? "rotate(45deg)" : undefined
              }}
            >
              {/* Internal Content (Counter-rotated if diamond) */}
              <div
                className={`w-full h-full flex flex-col overflow-hidden ${
                  node.type === "diamond" ? "-rotate-45 p-3 flex items-center justify-center" : ""
                }`}
              >
                {isArchitecture ? (
                  <>
                    {/* Header Bar */}
                    <div
                      className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${
                        theme === "light"
                          ? "bg-slate-100/80 border-slate-200"
                          : "bg-black/20 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="p-0.5 rounded bg-white/10 shrink-0">{icon}</div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                          {config.label}
                        </span>
                      </div>
                      {node.tech && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded truncate max-w-[80px] ${
                            theme === "light"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-indigo-950/70 text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          {node.tech}
                        </span>
                      )}
                    </div>

                    {/* Body text */}
                    <div className="p-3 flex-1 flex flex-col justify-center overflow-hidden">
                      <h4
                        className="font-medium tracking-tight leading-tight truncate"
                        style={{
                          fontSize: `${node.style?.fontSize || 13}px`,
                          color: node.style?.textColor || (theme === "light" ? "#20242A" : "#ffffff")
                        }}
                      >
                        {node.label}
                      </h4>
                      {node.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                          {node.description}
                        </p>
                      )}
                    </div>
                  </>
                ) : node.type === "freehand" && node.style?.points ? (
                  /* Freehand Pencil drawing */
                  <svg className="w-full h-full">
                    <polyline
                      points={node.style.points.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke={node.style.borderColor || (theme === "light" ? "#4f46e5" : "#818cf8")}
                      strokeWidth={node.style.borderWidth || 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  /* Basic Shapes (Rectangle, Ellipse, Diamond, Text) */
                  <div className={`w-full h-full p-2 flex flex-col ${textAlignClass}`}>
                    <span
                      className="font-medium leading-snug break-words"
                      style={{
                        fontSize: `${node.style?.fontSize || 14}px`,
                        color: node.style?.textColor || (theme === "light" ? "#20242A" : "#f1f5f9")
                      }}
                    >
                      {node.label}
                    </span>
                  </div>
                )}
              </div>

              {/* 4 Direction Connection Anchors */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setConnectingNodeId(isConnectingSource ? null : node.id, "right");
                }}
                className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border bg-white dark:bg-slate-900 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125 z-20 ${
                  isConnectingSource && connectingAnchor === "right"
                    ? "border-amber-400 bg-amber-400 opacity-100"
                    : "border-indigo-500 text-indigo-500"
                }`}
                title="Connect right"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setConnectingNodeId(isConnectingSource ? null : node.id, "bottom");
                }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-indigo-500 bg-white dark:bg-slate-900 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125 z-20"
                title="Connect bottom"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>

              {/* Universal 8-Point Resize Handles (Visible when selected) */}
              {isSelected && (
                <>
                  <div
                    className="resize-handle -top-1.5 -left-1.5 cursor-nwse-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "nw")}
                  />
                  <div
                    className="resize-handle -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "n")}
                  />
                  <div
                    className="resize-handle -top-1.5 -right-1.5 cursor-nesw-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "ne")}
                  />
                  <div
                    className="resize-handle top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "e")}
                  />
                  <div
                    className="resize-handle -bottom-1.5 -right-1.5 cursor-nwse-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "se")}
                  />
                  <div
                    className="resize-handle -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "s")}
                  />
                  <div
                    className="resize-handle -bottom-1.5 -left-1.5 cursor-nesw-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "sw")}
                  />
                  <div
                    className="resize-handle top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize"
                    onMouseDown={(e) => handleResizeStart(e, node, "w")}
                  />

                  {/* Live Dimension Indicator Tooltip */}
                  {isResizingThis && liveDimensions && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap shadow-md z-40">
                      {liveDimensions.width}px × {liveDimensions.height}px
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* In-progress Drag-to-Draw Shape Ghost */}
        {isDrawingShape && drawStart && drawCurrent && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-indigo-500 bg-indigo-500/10 z-30"
            style={{
              left: `${Math.min(drawStart.x, drawCurrent.x)}px`,
              top: `${Math.min(drawStart.y, drawCurrent.y)}px`,
              width: `${Math.abs(drawCurrent.x - drawStart.x)}px`,
              height: `${Math.abs(drawCurrent.y - drawStart.y)}px`,
              borderRadius:
                activeTool === "ellipse"
                  ? "9999px"
                  : activeTool === "rounded_rectangle"
                  ? "16px"
                  : "6px"
            }}
          />
        )}
      </div>

      {/* Floating Status Indicator if connecting */}
      {connectingNodeId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-amber-500 text-black font-medium text-xs flex items-center gap-2 shadow-xl z-30 backdrop-blur-md">
          <span>Click destination node to establish connection</span>
          <button
            onClick={() => setConnectingNodeId(null)}
            className="text-[10px] px-2 py-0.5 bg-black text-white rounded-full font-bold ml-1 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-[#0f131a] border border-slate-200 dark:border-white/10 rounded-xl p-1.5 shadow-2xl text-xs space-y-1 min-w-[170px]"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              duplicateSelected();
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-500" /> Duplicate (Ctrl+D)
          </button>
          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
          <button
            onClick={() => {
              updateZIndex(contextMenu.nodeId, "front");
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
          >
            <ArrowUp className="w-3.5 h-3.5" /> Bring to Front
          </button>
          <button
            onClick={() => {
              updateZIndex(contextMenu.nodeId, "back");
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
          >
            <ArrowDown className="w-3.5 h-3.5" /> Send to Back
          </button>
          <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
          <button
            onClick={() => {
              deleteSelected();
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete (Backspace)
          </button>
        </div>
      )}
    </div>
  );
};
