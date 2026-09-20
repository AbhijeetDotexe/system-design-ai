import { create } from "zustand";
import { DiagramDocument, DiagramNode, DiagramEdge, Viewport } from "@systemcraft/diagram-schema";
import dagre from "dagre";

export type ToolType = 
  | "select" 
  | "hand" 
  | "rectangle" 
  | "rounded_rectangle" 
  | "ellipse" 
  | "diamond" 
  | "arrow" 
  | "line" 
  | "text" 
  | "pencil";

interface HistoryEntry {
  document: DiagramDocument;
}

interface EditorState {
  diagramId: string | null;
  document: DiagramDocument;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  activeTool: ToolType;
  theme: "dark" | "light";
  connectingNodeId: string | null;
  connectingAnchor: "top" | "right" | "bottom" | "left" | null;
  isDraggingNode: boolean;
  isResizingNode: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  isAiModalOpen: boolean;
  isAiGenerating: boolean;
  aiStep: string;
  isJsonModalOpen: boolean;
  isShareModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isSaved: boolean;
  lastSavedAt: Date | null;

  // Actions
  setDiagram: (id: string | null, doc: DiagramDocument) => void;
  setTitle: (title: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setConnectingNodeId: (id: string | null, anchor?: "top" | "right" | "bottom" | "left" | null) => void;
  selectNode: (id: string, multi?: boolean) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  clearAll: () => void;
  
  // Node manipulation & Resizing
  addNode: (node: Partial<DiagramNode> & { label?: string }) => string;
  updateNodePosition: (id: string, x: number, y: number) => void;
  resizeNode: (id: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateZIndex: (id: string, action: "front" | "back" | "forward" | "backward") => void;

  // Edge manipulation
  addEdge: (source: string, target: string, label?: string) => void;
  updateEdge: (id: string, updates: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;

  // Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
  autoLayout: (direction?: "TB" | "LR") => void;

  // Modals & Save
  setAiModalOpen: (open: boolean) => void;
  setAiGenerating: (generating: boolean, step?: string) => void;
  setJsonModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setIsSaved: (saved: boolean) => void;

  // Undo / Redo
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_DOC: DiagramDocument = {
  title: "Untitled Architecture",
  nodes: [],
  edges: [],
  viewport: { x: 40, y: 40, zoom: 1 }
};

const savedTheme = (localStorage.getItem("systemcraft_theme") as "dark" | "light") || "dark";
if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
  document.documentElement.classList.add("dark");
}

export const useEditorStore = create<EditorState>((set, get) => ({
  diagramId: null,
  document: DEFAULT_DOC,
  selectedNodeIds: [],
  selectedEdgeId: null,
  activeTool: "select",
  theme: savedTheme,
  connectingNodeId: null,
  connectingAnchor: null,
  isDraggingNode: false,
  isResizingNode: false,
  history: [{ document: DEFAULT_DOC }],
  historyIndex: 0,
  isAiModalOpen: false,
  isAiGenerating: false,
  aiStep: "",
  isJsonModalOpen: false,
  isShareModalOpen: false,
  isShortcutsModalOpen: false,
  isSaved: true,
  lastSavedAt: null,

  setDiagram: (id, doc) => {
    set({
      diagramId: id,
      document: doc,
      selectedNodeIds: [],
      selectedEdgeId: null,
      history: [{ document: JSON.parse(JSON.stringify(doc)) }],
      historyIndex: 0,
      isSaved: true
    });
  },

  setTitle: (title) => {
    set((state) => ({
      document: { ...state.document, title },
      isSaved: false
    }));
  },

  setActiveTool: (tool) => set({ activeTool: tool }),

  setTheme: (theme) => {
    localStorage.setItem("systemcraft_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },

  setConnectingNodeId: (id, anchor = null) => set({ connectingNodeId: id, connectingAnchor: anchor }),

  selectNode: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const already = state.selectedNodeIds.includes(id);
        return {
          selectedNodeIds: already
            ? state.selectedNodeIds.filter((item) => item !== id)
            : [...state.selectedNodeIds, id],
          selectedEdgeId: null
        };
      }
      return { selectedNodeIds: [id], selectedEdgeId: null };
    });
  },

  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeIds: [] }),
  clearSelection: () => set({ selectedNodeIds: [], selectedEdgeId: null, connectingNodeId: null, connectingAnchor: null }),

  pushHistory: () => {
    const { document, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ document: JSON.parse(JSON.stringify(document)) });
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1, isSaved: false });
  },

  addNode: (nodeData) => {
    const id = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNode: DiagramNode = {
      id,
      type: nodeData.type || "service",
      label: nodeData.label !== undefined ? nodeData.label : "Component",
      description: nodeData.description || "",
      tech: nodeData.tech || "",
      position: nodeData.position || { x: 200, y: 150 },
      width: Math.max(60, nodeData.width || 240),
      height: Math.max(40, nodeData.height || 110),
      style: nodeData.style
    };

    set((state) => ({
      document: {
        ...state.document,
        nodes: [...state.document.nodes, newNode]
      },
      selectedNodeIds: [id],
      isSaved: false
    }));

    get().pushHistory();
    return id;
  },

  updateNodePosition: (id, x, y) => {
    set((state) => ({
      document: {
        ...state.document,
        nodes: state.document.nodes.map((node) =>
          node.id === id ? { ...node, position: { x, y } } : node
        )
      },
      isSaved: false
    }));
  },

  resizeNode: (id, bounds) => {
    set((state) => ({
      document: {
        ...state.document,
        nodes: state.document.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                position: { x: bounds.x, y: bounds.y },
                width: Math.max(40, bounds.width),
                height: Math.max(30, bounds.height)
              }
            : node
        )
      },
      isSaved: false
    }));
  },

  updateNode: (id, updates) => {
    set((state) => ({
      document: {
        ...state.document,
        nodes: state.document.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                ...updates,
                width: updates.width ? Math.max(40, updates.width) : node.width,
                height: updates.height ? Math.max(30, updates.height) : node.height,
                style: { ...node.style, ...updates.style }
              }
            : node
        )
      },
      isSaved: false
    }));
    get().pushHistory();
  },

  updateZIndex: (id, action) => {
    const { document } = get();
    const index = document.nodes.findIndex((n) => n.id === id);
    if (index === -1) return;

    const nodes = [...document.nodes];
    const target = nodes[index];

    if (action === "front") {
      nodes.splice(index, 1);
      nodes.push(target);
    } else if (action === "back") {
      nodes.splice(index, 1);
      nodes.unshift(target);
    } else if (action === "forward" && index < nodes.length - 1) {
      nodes[index] = nodes[index + 1];
      nodes[index + 1] = target;
    } else if (action === "backward" && index > 0) {
      nodes[index] = nodes[index - 1];
      nodes[index - 1] = target;
    }

    set({
      document: { ...document, nodes },
      isSaved: false
    });
    get().pushHistory();
  },

  deleteSelected: () => {
    const { selectedNodeIds, selectedEdgeId, document } = get();
    if (selectedNodeIds.length === 0 && !selectedEdgeId) return;

    const remainingNodes = document.nodes.filter((n) => !selectedNodeIds.includes(n.id));
    const remainingEdges = document.edges.filter(
      (e) =>
        e.id !== selectedEdgeId &&
        !selectedNodeIds.includes(e.source) &&
        !selectedNodeIds.includes(e.target)
    );

    set({
      document: {
        ...document,
        nodes: remainingNodes,
        edges: remainingEdges
      },
      selectedNodeIds: [],
      selectedEdgeId: null,
      isSaved: false
    });
    get().pushHistory();
  },

  clearAll: () => {
    set({
      document: {
        ...get().document,
        nodes: [],
        edges: []
      },
      selectedNodeIds: [],
      selectedEdgeId: null,
      isSaved: false
    });
    get().pushHistory();
  },

  duplicateSelected: () => {
    const { selectedNodeIds, document } = get();
    if (selectedNodeIds.length === 0) return;

    const newNodes: DiagramNode[] = [];
    const newSelectedIds: string[] = [];

    for (const id of selectedNodeIds) {
      const existing = document.nodes.find((n) => n.id === id);
      if (existing) {
        const newId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        newNodes.push({
          ...JSON.parse(JSON.stringify(existing)),
          id: newId,
          label: existing.label ? `${existing.label} (Copy)` : "Copy",
          position: {
            x: existing.position.x + 30,
            y: existing.position.y + 30
          }
        });
        newSelectedIds.push(newId);
      }
    }

    set({
      document: {
        ...document,
        nodes: [...document.nodes, ...newNodes]
      },
      selectedNodeIds: newSelectedIds,
      isSaved: false
    });
    get().pushHistory();
  },

  addEdge: (source, target, label = "") => {
    if (source === target) return;
    const { document } = get();
    const exists = document.edges.some((e) => e.source === source && e.target === target);
    if (exists) return;

    const newEdge: DiagramEdge = {
      id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source,
      target,
      label,
      type: "arrow"
    };

    set({
      document: {
        ...document,
        edges: [...document.edges, newEdge]
      },
      connectingNodeId: null,
      connectingAnchor: null,
      selectedEdgeId: newEdge.id,
      selectedNodeIds: [],
      isSaved: false
    });
    get().pushHistory();
  },

  updateEdge: (id, updates) => {
    set((state) => ({
      document: {
        ...state.document,
        edges: state.document.edges.map((e) => (e.id === id ? { ...e, ...updates } : e))
      },
      isSaved: false
    }));
    get().pushHistory();
  },

  deleteEdge: (id) => {
    set((state) => ({
      document: {
        ...state.document,
        edges: state.document.edges.filter((e) => e.id !== id)
      },
      selectedEdgeId: null,
      isSaved: false
    }));
    get().pushHistory();
  },

  setViewport: (viewportUpdates) => {
    set((state) => ({
      document: {
        ...state.document,
        viewport: { ...state.document.viewport, ...viewportUpdates }
      }
    }));
  },

  zoomIn: () => {
    const current = get().document.viewport.zoom;
    const next = Math.min(2.5, +(current + 0.15).toFixed(2));
    get().setViewport({ zoom: next });
  },

  zoomOut: () => {
    const current = get().document.viewport.zoom;
    const next = Math.max(0.2, +(current - 0.15).toFixed(2));
    get().setViewport({ zoom: next });
  },

  resetZoom: () => {
    get().setViewport({ zoom: 1, x: 50, y: 50 });
  },

  fitToScreen: () => {
    const { document } = get();
    if (document.nodes.length === 0) {
      get().resetZoom();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of document.nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.width || 180));
      maxY = Math.max(maxY, node.position.y + (node.height || 85));
    }

    const pad = 100;
    const diagWidth = maxX - minX + pad * 2;
    const diagHeight = maxY - minY + pad * 2;

    const viewportEl = window.document.getElementById("canvas-viewport");
    const containerWidth = viewportEl ? viewportEl.clientWidth : 1200;
    const containerHeight = viewportEl ? viewportEl.clientHeight : 800;

    const scaleX = containerWidth / diagWidth;
    const scaleY = containerHeight / diagHeight;
    const newZoom = Math.min(1.2, Math.max(0.3, Math.min(scaleX, scaleY)));

    const newX = (containerWidth - (maxX - minX) * newZoom) / 2 - minX * newZoom;
    const newY = (containerHeight - (maxY - minY) * newZoom) / 2 - minY * newZoom;

    get().setViewport({ x: Math.round(newX), y: Math.round(newY), zoom: +newZoom.toFixed(2) });
  },

  autoLayout: (direction = "LR") => {
    const { document } = get();
    if (document.nodes.length === 0) return;

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: direction,
      nodesep: 160,
      ranksep: 220,
      marginx: 100,
      marginy: 100
    });
    g.setDefaultEdgeLabel(() => ({}));

    document.nodes.forEach((n) => {
      g.setNode(n.id, { width: n.width || 180, height: n.height || 85 });
    });

    document.edges.forEach((e) => {
      if (g.hasNode(e.source) && g.hasNode(e.target)) {
        g.setEdge(e.source, e.target);
      }
    });

    dagre.layout(g);

    const laidOutNodes = document.nodes.map((node) => {
      const dagreNode = g.node(node.id);
      if (!dagreNode) return node;
      return {
        ...node,
        position: {
          x: Math.round(dagreNode.x - (node.width || 180) / 2),
          y: Math.round(dagreNode.y - (node.height || 85) / 2)
        }
      };
    });

    set({
      document: {
        ...document,
        nodes: laidOutNodes
      },
      isSaved: false
    });
    get().pushHistory();
  },

  setAiModalOpen: (open) => set({ isAiModalOpen: open }),
  setAiGenerating: (generating, step = "") => set({ isAiGenerating: generating, aiStep: step }),
  setJsonModalOpen: (open) => set({ isJsonModalOpen: open }),
  setShareModalOpen: (open) => set({ isShareModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),
  setIsSaved: (saved) => set({ isSaved: saved, lastSavedAt: saved ? new Date() : get().lastSavedAt }),

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetDoc = history[nextIndex].document;
      set({
        document: JSON.parse(JSON.stringify(targetDoc)),
        historyIndex: nextIndex,
        isSaved: false,
        selectedNodeIds: [],
        selectedEdgeId: null
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetDoc = history[nextIndex].document;
      set({
        document: JSON.parse(JSON.stringify(targetDoc)),
        historyIndex: nextIndex,
        isSaved: false,
        selectedNodeIds: [],
        selectedEdgeId: null
      });
    }
  }
}));
