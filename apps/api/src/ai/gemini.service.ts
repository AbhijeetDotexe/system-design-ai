import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  AiDiagramResponse,
  AiDiagramResponseSchema,
  DiagramDocument
} from "@systemcraft/diagram-schema";
import {
  SYSTEM_DESIGN_ARCHITECT_PROMPT,
  SYSTEM_DESIGN_MODIFY_PROMPT,
  SYSTEM_DESIGN_SIMPLIFY_PROMPT,
  SYSTEM_DESIGN_SUMMARIZE_PROMPT
} from "./gemini.prompts.js";
import { applyDagreLayout } from "../layout/dagre-layout.js";
import type { DiagramDetail } from "@systemcraft/diagram-schema";

const DETAIL_BUDGETS: Record<string, { maxNodes: number; maxEdges: number }> = {
  simple: { maxNodes: 7, maxEdges: 8 },
  standard: { maxNodes: 11, maxEdges: 13 },
  detailed: { maxNodes: 15, maxEdges: 18 }
};

export class GeminiService {
  private clients: GoogleGenAI[] = [];
  private keyIndex = 0;

  constructor() {
    if (ENV.OPENROUTER_API_KEY && ENV.OPENROUTER_API_KEY.length > 10) {
      logger.info(`[AiService] Initialized OpenRouter provider with models: ${ENV.OPENROUTER_MODELS.slice(0, 3).join(", ")}`);
    }
    const keys = ENV.GEMINI_API_KEYS.filter(k => k && k.length > 10);
    if (keys.length > 0) {
      this.clients = keys.map(k => new GoogleGenAI({ apiKey: k }));
      logger.info(`[GeminiService] Initialized ${this.clients.length} Gemini client(s) with model: ${ENV.GEMINI_MODEL}`);
    }
    if (!this.hasAiProvider()) {
      logger.warn("[AiService] No AI API keys configured. Intelligent heuristic fallback mode active.");
    }
  }

  private hasAiProvider(): boolean {
    return (!!ENV.OPENROUTER_API_KEY && ENV.OPENROUTER_API_KEY.length > 10) || this.clients.length > 0;
  }

  private getNextClient(): GoogleGenAI | null {
    if (this.clients.length === 0) return null;
    const client = this.clients[this.keyIndex];
    this.keyIndex = (this.keyIndex + 1) % this.clients.length;
    return client;
  }

  private async callOpenRouter(promptText: string): Promise<string> {
    const models = ENV.OPENROUTER_MODELS.slice(0, 3);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.OPENROUTER_API_KEY}`,
        "HTTP-Referer": ENV.CLIENT_URL || "https://blueprint.abhijeetrana.com",
        "X-Title": "Blueprint AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        models,
        messages: [{ role: "user", content: promptText }],
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
    }

    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content || "";
  }

  /**
   * Helper to execute AI model calls with retry.
   * Uses OpenRouter if configured, falling back to Gemini and retry rotations.
   */
  private async executeWithRetry(
    promptText: string,
    retries = 2,
    delayMs = 1500
  ): Promise<string> {
    // 1. Try OpenRouter if key is present
    if (ENV.OPENROUTER_API_KEY && ENV.OPENROUTER_API_KEY.length > 10) {
      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
          const content = await this.callOpenRouter(promptText);
          if (content && content.trim()) {
            return content;
          }
        } catch (err: any) {
          logger.warn(`[AiService] OpenRouter attempt ${attempt} failed: ${err.message}`);
          if (attempt <= retries) {
            await new Promise((r) => setTimeout(r, delayMs * attempt));
            continue;
          }
          logger.error("[AiService] All OpenRouter retries failed, falling back to Gemini if configured");
        }
      }
    }

    // 2. Fallback to Gemini if clients are available
    if (this.clients.length > 0) {
      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        const client = this.getNextClient();
        if (!client) break;

        try {
          const response = await client.models.generateContent({
            model: ENV.GEMINI_MODEL,
            contents: promptText
          });
          return response.text || "";
        } catch (err: any) {
          const is503 = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
          const is429 = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota");
          if ((is503 || is429) && attempt <= retries) {
            logger.warn(`[GeminiService] Transient ${is503 ? 503 : 429} from Gemini on attempt ${attempt}. Retrying in ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs * attempt));
            continue;
          }
          if (attempt > retries) throw err;
        }
      }
    }

    throw new Error("No AI providers available or all attempts failed");
  }

  /**
   * Generates a complete architecture diagram from a user description.
   * Diagrams are intentionally kept small so they stay readable.
   */
  async generateDiagram(prompt: string, detail: DiagramDetail = "standard"): Promise<DiagramDocument> {
    logger.info(`[GeminiService] Generating diagram (detail=${detail}) for prompt: "${prompt.slice(0, 80)}..."`);

    const budget = DETAIL_BUDGETS[detail ?? "standard"] ?? DETAIL_BUDGETS.standard;
    let rawJsonText = "";

    if (this.hasAiProvider()) {
      try {
        const systemPrompt = SYSTEM_DESIGN_ARCHITECT_PROMPT
          .replaceAll("{{MAX_NODES}}", String(budget.maxNodes))
          .replaceAll("{{MAX_EDGES}}", String(budget.maxEdges));
        const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}\n\nGenerate the system architecture JSON:`;
        rawJsonText = await this.executeWithRetry(fullPrompt);
      } catch (err) {
        logger.error("[AiService] AI generation call failed, falling back to intelligent heuristics:", err);
        rawJsonText = this.generateIntelligentFallback(prompt, detail);
      }
    } else {
      rawJsonText = this.generateIntelligentFallback(prompt, detail);
    }

    const parsed = this.safeParseAndValidate(rawJsonText, prompt);
    const capped = this.enforceSimplicity(parsed, budget.maxNodes, budget.maxEdges);

    // Apply automatic layout (Dagre) — wider spacing for bigger graphs
    const formattedNodes = capped.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description || "",
      tech: n.tech || "",
      position: { x: n.position?.x || 0, y: n.position?.y || 0 },
      width: n.width || 240,
      height: n.height || 110
    }));

    const formattedEdges = capped.edges.map((e, index) => ({
      id: e.id || `e-${index}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || "calls",
      type: e.type || "arrow"
    }));

    const layoutResult = applyDagreLayout(formattedNodes, formattedEdges, {
      direction: "LR",
      nodeSpacing: capped.nodes.length > 10 ? 90 : 70,
      rankSpacing: capped.nodes.length > 10 ? 130 : 110
    });

    return {
      title: capped.title || "AI Generated Architecture",
      description: capped.description || `Generated from prompt: "${prompt}"`,
      nodes: layoutResult.nodes,
      edges: layoutResult.edges,
      viewport: { x: 50, y: 50, zoom: 0.9 }
    };
  }

  /**
   * Reduces an existing (too complex) diagram to its core boxes.
   */
  async simplifyDiagram(currentDiagram: DiagramDocument, maxNodes = 8): Promise<DiagramDocument> {
    const budget = { maxNodes, maxEdges: maxNodes + 2 };
    logger.info(`[GeminiService] Simplifying diagram to ${maxNodes} nodes`);

    let rawJsonText = "";

    if (this.hasAiProvider()) {
      try {
        const diagramSummary = JSON.stringify({
          title: currentDiagram.title,
          nodes: currentDiagram.nodes.map((n) => ({ id: n.id, type: n.type, label: n.label, tech: (n as any).tech, description: (n as any).description })),
          edges: currentDiagram.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
        });
        const systemPrompt = SYSTEM_DESIGN_SIMPLIFY_PROMPT
          .replaceAll("{{MAX_NODES}}", String(budget.maxNodes))
          .replaceAll("{{MAX_EDGES}}", String(budget.maxEdges));
        rawJsonText = await this.executeWithRetry(
          `${systemPrompt}\n\nCurrent Architecture:\n${diagramSummary}\n\nOutput simplified architecture JSON:`
        );
      } catch (err) {
        logger.error("[GeminiService] Simplify call failed, using local fallback:", err);
        rawJsonText = JSON.stringify({
          title: currentDiagram.title,
          description: currentDiagram.description,
          nodes: currentDiagram.nodes.slice(0, maxNodes),
          edges: currentDiagram.edges.filter(
            (e, i) => i < budget.maxEdges &&
              currentDiagram.nodes.slice(0, maxNodes).some((n) => n.id === e.source) &&
              currentDiagram.nodes.slice(0, maxNodes).some((n) => n.id === e.target)
          )
        });
      }
    } else {
      rawJsonText = JSON.stringify({
        title: currentDiagram.title,
        description: currentDiagram.description,
        nodes: currentDiagram.nodes.slice(0, maxNodes),
        edges: currentDiagram.edges.filter(
          (e, i) => i < budget.maxEdges &&
            currentDiagram.nodes.slice(0, maxNodes).some((n) => n.id === e.source) &&
            currentDiagram.nodes.slice(0, maxNodes).some((n) => n.id === e.target)
        )
      });
    }

    const parsed = this.safeParseAndValidate(rawJsonText, currentDiagram.title);
    const capped = this.enforceSimplicity(parsed, budget.maxNodes, budget.maxEdges);

    const formattedNodes = capped.nodes.map((n) => {
      const existing = currentDiagram.nodes.find((ex) => ex.id === n.id);
      return {
        id: n.id,
        type: n.type,
        label: n.label,
        description: n.description || (existing as any)?.description || "",
        tech: n.tech || (existing as any)?.tech || "",
        position: (existing as any)?.position || { x: 100, y: 100 },
        width: n.width || (existing as any)?.width || 240,
        height: n.height || (existing as any)?.height || 110,
        style: (existing as any)?.style
      };
    });

    const formattedEdges = capped.edges.map((e, idx) => ({
      id: e.id || `e-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || "connects",
      type: e.type || "arrow"
    }));

    const layoutResult = applyDagreLayout(formattedNodes, formattedEdges, { direction: "LR" });

    return {
      ...currentDiagram,
      title: capped.title || currentDiagram.title,
      nodes: layoutResult.nodes,
      edges: layoutResult.edges
    };
  }

  /**
   * Hard guardrails so no diagram is ever unreadable:
   * caps node/edge counts, drops orphan edges, trims long labels.
   */
  private enforceSimplicity(
    doc: AiDiagramResponse,
    maxNodes: number,
    maxEdges: number
  ): AiDiagramResponse {
    const trimWords = (s: string | undefined, max: number) => {
      if (!s) return s as any;
      const words = s.trim().split(/\s+/);
      return words.length > max ? words.slice(0, max).join(" ") : s.trim();
    };

    let nodes = (doc.nodes || []).map((n) => ({
      ...n,
      label: trimWords(n.label, 4) || "Service",
      tech: trimWords(n.tech, 3),
      description: trimWords(n.description, 14)
    }));

    // Keep connected nodes first so trimming never strands orphans
    if (nodes.length > maxNodes) {
      const degree = new Map<string, number>();
      for (const e of doc.edges || []) {
        degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
        degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
      }
      nodes = [...nodes]
        .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
        .slice(0, maxNodes);
    }

    const ids = new Set(nodes.map((n) => n.id));
    let edges = (doc.edges || [])
      .filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target)
      .map((e) => ({ ...e, label: trimWords(e.label, 3) }));
    // de-duplicate parallel edges
    const seen = new Set<string>();
    edges = edges.filter((e) => {
      const k = `${e.source}->${e.target}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, maxEdges);

    // Drop nodes left disconnected (unless that would empty the diagram)
    if (nodes.length > 1) {
      const connected = new Set<string>();
      for (const e of edges) {
        connected.add(e.source);
        connected.add(e.target);
      }
      const filtered = nodes.filter((n) => connected.has(n.id));
      if (filtered.length >= Math.min(2, nodes.length)) {
        const keep = new Set(filtered.map((n) => n.id));
        nodes = filtered;
        edges = edges.filter((e) => keep.has(e.source) && keep.has(e.target));
      }
    }

    return { ...doc, nodes, edges };
  }

  /**
   * Modifies an existing architecture diagram according to an instruction
   */
  async modifyDiagram(instruction: string, currentDiagram: DiagramDocument): Promise<DiagramDocument> {
    logger.info(`[GeminiService] Modifying diagram with instruction: "${instruction}"`);

    let rawJsonText = "";

    if (this.hasAiProvider()) {
      try {
        const diagramSummary = JSON.stringify({
          title: currentDiagram.title,
          nodes: currentDiagram.nodes.map((n) => ({ id: n.id, type: n.type, label: n.label, tech: n.tech })),
          edges: currentDiagram.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
        });

        const fullPrompt = `${SYSTEM_DESIGN_MODIFY_PROMPT}\n\nCurrent Architecture:\n${diagramSummary}\n\nUser Instruction:\n${instruction}\n\nOutput updated architecture JSON:`;
        rawJsonText = await this.executeWithRetry(fullPrompt);
      } catch (err) {
        logger.error("[GeminiService] Gemini modify call failed, using heuristic modifier:", err);
        rawJsonText = this.heuristicModify(instruction, currentDiagram);
      }
    } else {
      rawJsonText = this.heuristicModify(instruction, currentDiagram);
    }

    const parsed = this.safeParseAndValidate(rawJsonText, currentDiagram.title);

    // Merge or maintain layout
    const formattedNodes = parsed.nodes.map((n) => {
      const existing = currentDiagram.nodes.find((ex) => ex.id === n.id);
      return {
        id: n.id,
        type: n.type,
        label: n.label,
        description: n.description || existing?.description || "",
        tech: n.tech || existing?.tech || "",
        position: existing?.position || { x: n.position?.x || 100, y: n.position?.y || 100 },
        width: n.width || existing?.width || 180,
        height: n.height || existing?.height || 85,
        style: existing?.style
      };
    });

    const formattedEdges = parsed.edges.map((e, idx) => ({
      id: e.id || `e-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || "connects",
      type: e.type || "arrow"
    }));

    const layoutResult = applyDagreLayout(formattedNodes, formattedEdges, {
      direction: "LR"
    });

    return {
      ...currentDiagram,
      title: parsed.title || currentDiagram.title,
      nodes: layoutResult.nodes,
      edges: layoutResult.edges
    };
  }

  private safeParseAndValidate(jsonText: string, fallbackTitle: string): AiDiagramResponse {
    let cleaned = jsonText.trim();

    // Strip markdown code fences if present
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    } else {
      // Extract between outermost JSON braces
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
      }
    }

    try {
      const parsed = JSON.parse(cleaned);
      const validated = AiDiagramResponseSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
      logger.warn("[AiService] Zod validation issues in AI response, sanitizing:", validated.error.format());

      return {
        title: parsed.title || fallbackTitle || "System Architecture",
        description: parsed.description,
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges : []
      };
    } catch (parseError) {
      logger.error("[AiService] JSON parse error on AI response:", parseError, cleaned);
      throw new Error("Failed to parse AI response into structured architecture JSON");
    }
  }

  private generateIntelligentFallback(prompt: string, detail: DiagramDetail = "standard"): string {
    const budget = DETAIL_BUDGETS[detail ?? "standard"] ?? DETAIL_BUDGETS.standard;
    const lower = prompt.toLowerCase();
    const isFood = lower.includes("food") || lower.includes("delivery");
    const isInstagram = lower.includes("instagram") || lower.includes("photo") || lower.includes("social");

    const trimToBudget = (doc: any) => {
      const nodes = doc.nodes.slice(0, budget.maxNodes);
      const ids = new Set(nodes.map((n: any) => n.id));
      const edges = doc.edges
        .filter((e: any) => ids.has(e.source) && ids.has(e.target))
        .slice(0, budget.maxEdges);
      return JSON.stringify({ ...doc, nodes, edges });
    };

    if (isFood) {
      return trimToBudget({
        title: "Food Delivery Architecture",
        description: "Event-driven system handling orders, drivers, restaurant dispatch, and real-time tracking.",
        nodes: [
          { id: "cust-app", type: "mobile", label: "Customer App", description: "Order food and track drivers", tech: "Flutter" },
          { id: "rest-portal", type: "browser", label: "Restaurant Portal", description: "Kitchen order management", tech: "React" },
          { id: "driver-app", type: "mobile", label: "Driver App", description: "GPS tracking and order acceptance", tech: "Kotlin" },
          { id: "api-gw", type: "api_gateway", label: "API Gateway", description: "Auth and rate limiting", tech: "Kong" },
          { id: "order-svc", type: "microservice", label: "Order Service", description: "Order lifecycle state machine", tech: "Go" },
          { id: "dispatch-svc", type: "microservice", label: "Dispatch Service", description: "Matches drivers to orders", tech: "Python" },
          { id: "pay-svc", type: "microservice", label: "Payment Service", description: "Escrow and payouts", tech: "Node.js" },
          { id: "redis-geo", type: "redis", label: "Driver Locations", description: "Live driver positions cache", tech: "Redis 7" },
          { id: "order-db", type: "postgresql", label: "Orders DB", description: "Transactional order storage", tech: "Postgres 16" },
          { id: "kafka", type: "kafka", label: "Event Bus", description: "Order and payment events", tech: "Kafka" },
          { id: "notif-svc", type: "microservice", label: "Notifications", description: "Push alerts and SMS", tech: "FCM" }
        ],
        edges: [
          { id: "e1", source: "cust-app", target: "api-gw", label: "HTTPS" },
          { id: "e2", source: "rest-portal", target: "api-gw", label: "HTTPS" },
          { id: "e3", source: "driver-app", target: "api-gw", label: "Live GPS" },
          { id: "e4", source: "api-gw", target: "order-svc", label: "/orders" },
          { id: "e5", source: "api-gw", target: "dispatch-svc", label: "/dispatch" },
          { id: "e6", source: "driver-app", target: "redis-geo", label: "Update Location" },
          { id: "e7", source: "dispatch-svc", target: "redis-geo", label: "Query Nearby Drivers" },
          { id: "e8", source: "order-svc", target: "order-db", label: "Persist Order" },
          { id: "e9", source: "order-svc", target: "pay-svc", label: "Process Payment" },
          { id: "e10", source: "order-svc", target: "kafka", label: "OrderPlaced Event" },
          { id: "e11", source: "kafka", target: "notif-svc", label: "Trigger Notifications" }
        ]
      });
    }

    if (isInstagram) {
      return trimToBudget({
        title: "Photo Sharing Architecture",
        description: "Media-heavy social network supporting photo uploads, feed generation, and high-concurrency read traffic.",
        nodes: [
          { id: "client", type: "mobile", label: "Mobile App", description: "Browse feeds and post photos", tech: "Swift" },
          { id: "cdn", type: "cdn", label: "Media CDN", description: "Caches photos at the edge", tech: "Cloudflare" },
          { id: "lb", type: "load_balancer", label: "Load Balancer", description: "Spreads traffic across servers", tech: "AWS ALB" },
          { id: "api-gw", type: "api_gateway", label: "API Gateway", description: "Routing and auth checks", tech: "Envoy" },
          { id: "feed-svc", type: "microservice", label: "Feed Service", description: "Serves home timelines", tech: "Go" },
          { id: "media-svc", type: "microservice", label: "Upload Service", description: "Processes photo uploads", tech: "Rust" },
          { id: "user-svc", type: "microservice", label: "User Service", description: "Profiles and follower graph", tech: "Java" },
          { id: "redis-feed", type: "redis", label: "Feed Cache", description: "Precomputed timeline cache", tech: "Redis" },
          { id: "s3-media", type: "storage", label: "Media Storage", description: "Stores photos and videos", tech: "AWS S3" },
          { id: "postgres-main", type: "postgresql", label: "Posts DB", description: "Posts, likes and comments", tech: "Postgres" },
          { id: "kafka", type: "kafka", label: "Event Bus", description: "New-post fan-out events", tech: "Kafka" }
        ],
        edges: [
          { id: "e1", source: "client", target: "cdn", label: "Fetch Media" },
          { id: "e2", source: "client", target: "lb", label: "API Requests" },
          { id: "e3", source: "lb", target: "api-gw", label: "Forward Traffic" },
          { id: "e4", source: "api-gw", target: "feed-svc", label: "/feed" },
          { id: "e5", source: "api-gw", target: "media-svc", label: "/upload" },
          { id: "e6", source: "api-gw", target: "user-svc", label: "/users" },
          { id: "e7", source: "feed-svc", target: "redis-feed", label: "Read Fan-out Feed" },
          { id: "e8", source: "media-svc", target: "s3-media", label: "Store Assets" },
          { id: "e9", source: "user-svc", target: "postgres-main", label: "SQL" },
          { id: "e10", source: "media-svc", target: "kafka", label: "Publish PostCreated" },
          { id: "e11", source: "kafka", target: "feed-svc", label: "Async Fan-out Worker" }
        ]
      });
    }

    return trimToBudget({
      title: "Distributed System Architecture",
      description: "Resilient high-throughput architecture with API Gateway, caching tier, primary database, and event streaming.",
      nodes: [
          { id: "client", type: "client", label: "Clients", description: "Web and mobile users", tech: "React" },
          { id: "cdn", type: "cdn", label: "Edge CDN", description: "Caches static content", tech: "Cloudflare" },
          { id: "lb", type: "load_balancer", label: "Load Balancer", description: "Spreads incoming traffic", tech: "NGINX" },
          { id: "api-gw", type: "api_gateway", label: "API Gateway", description: "Routing and auth", tech: "Kong" },
          { id: "core-svc", type: "service", label: "Core Service", description: "Main business logic", tech: "Node.js" },
          { id: "redis", type: "redis", label: "Redis Cache", description: "Fast read cache", tech: "Redis 7" },
          { id: "database", type: "postgresql", label: "Main DB", description: "Persistent data storage", tech: "Postgres 16" },
          { id: "kafka", type: "kafka", label: "Event Bus", description: "Background event stream", tech: "Kafka" },
          { id: "worker-svc", type: "microservice", label: "Worker Service", description: "Handles background jobs", tech: "Python" },
          { id: "storage", type: "storage", label: "File Storage", description: "Files and backups", tech: "AWS S3" }
      ],
      edges: [
          { id: "e1", source: "client", target: "cdn", label: "HTTPS" },
          { id: "e2", source: "cdn", target: "lb", label: "Cache miss" },
          { id: "e3", source: "lb", target: "api-gw", label: "Forward" },
          { id: "e4", source: "api-gw", target: "core-svc", label: "Route" },
          { id: "e5", source: "core-svc", target: "redis", label: "Cache check" },
          { id: "e6", source: "core-svc", target: "database", label: "Save" },
        { id: "e7", source: "core-svc", target: "kafka", label: "Produce Events" },
        { id: "e8", source: "kafka", target: "worker-svc", label: "Consume Events" },
        { id: "e9", source: "worker-svc", target: "storage", label: "Store Blobs" }
      ]
    });
  }

  private heuristicModify(instruction: string, current: DiagramDocument): string {
    const lower = instruction.toLowerCase();
    const updatedNodes = [...current.nodes];
    const updatedEdges = [...current.edges];

    if (lower.includes("redis") || lower.includes("cache")) {
      const redisExists = updatedNodes.some((n) => n.id === "redis-cache" || n.type === "redis");
      if (!redisExists) {
        updatedNodes.push({
          id: "redis-cache",
          type: "redis",
          label: "Redis Cache Layer",
          description: "In-memory caching for query acceleration",
          tech: "Redis 7",
          position: { x: 600, y: 200 },
          width: 180,
          height: 80
        });
        const apiNode = updatedNodes.find((n) => n.type === "service" || n.type === "api_gateway");
        if (apiNode) {
          updatedEdges.push({
            id: `e-api-redis-${Date.now()}`,
            source: apiNode.id,
            target: "redis-cache",
            label: "Cache-Aside Read",
            type: "arrow"
          });
        }
      }
    }

    if (lower.includes("kafka") || lower.includes("queue")) {
      const kafkaExists = updatedNodes.some((n) => n.id === "kafka-stream" || n.type === "kafka");
      if (!kafkaExists) {
        updatedNodes.push({
          id: "kafka-stream",
          type: "kafka",
          label: "Kafka Event Broker",
          description: "Asynchronous event stream for distributed processing",
          tech: "Apache Kafka",
          position: { x: 800, y: 300 },
          width: 190,
          height: 80
        });
        const svcNode = updatedNodes.find((n) => n.type === "service" || n.type === "microservice");
        if (svcNode) {
          updatedEdges.push({
            id: `e-svc-kafka-${Date.now()}`,
            source: svcNode.id,
            target: "kafka-stream",
            label: "Publish Event",
            type: "arrow"
          });
        }
      }
    }

    if (lower.includes("cdn") || lower.includes("cloudflare")) {
      const cdnExists = updatedNodes.some((n) => n.type === "cdn");
      if (!cdnExists) {
        updatedNodes.unshift({
          id: "edge-cdn",
          type: "cdn",
          label: "Cloudflare Edge CDN",
          description: "Global edge caching and DDoS protection",
          tech: "Cloudflare",
          position: { x: 150, y: 150 },
          width: 180,
          height: 80
        });
      }
    }

    return JSON.stringify({
      title: current.title,
      description: current.description,
      nodes: updatedNodes,
      edges: updatedEdges
    });
  }

  /**
   * Summarizes a diagram in plain English for non-technical stakeholders
   */
  async summarizeDiagram(currentDiagram: DiagramDocument): Promise<string> {
    logger.info(`[GeminiService] Summarizing diagram: "${currentDiagram.title}"`);

    if (!this.hasAiProvider()) {
      return this.fallbackSummary(currentDiagram);
    }

    try {
      const diagramSummary = JSON.stringify({
        title: currentDiagram.title,
        nodes: currentDiagram.nodes.map((n) => ({
          id: n.id, type: n.type, label: n.label, tech: n.tech, description: n.description
        })),
        edges: currentDiagram.edges.map((e) => ({
          id: e.id, source: e.source, target: e.target, label: e.label
        }))
      });

      const fullPrompt = `${SYSTEM_DESIGN_SUMMARIZE_PROMPT}\n\nArchitecture Diagram:\n${diagramSummary}\n\nSummary:`;
      return await this.executeWithRetry(fullPrompt);
    } catch (err) {
      logger.error("[GeminiService] Summarize call failed, using fallback:", err);
      return this.fallbackSummary(currentDiagram);
    }
  }

  private fallbackSummary(doc: DiagramDocument): string {
    const nodes = doc.nodes || [];
    const edges = doc.edges || [];

    if (nodes.length === 0) {
      return "This diagram is empty. Add components to see a summary.";
    }

    const clients = nodes.filter(n => ["client", "browser", "mobile"].includes(n.type));
    const services = nodes.filter(n => ["service", "microservice", "server"].includes(n.type));
    const databases = nodes.filter(n => ["database", "postgresql", "mongodb", "mysql", "redis", "cache"].includes(n.type));
    const gateways = nodes.filter(n => ["api_gateway", "load_balancer", "cdn"].includes(n.type));

    const mainService = services[0] || nodes[0];
    const mainDb = databases[0];

    let summary = `This system lets users ${mainService?.label?.toLowerCase() || "perform actions"} through ${clients[0]?.label?.toLowerCase() || "a client"}.`;

    if (gateways.length > 0) {
      summary += ` Requests go through ${gateways[0].label.toLowerCase()}`;
    }

    if (services.length > 0) {
      summary += ` to the ${services.map(s => s.label.toLowerCase()).join(", ")} service${services.length > 1 ? "s" : ""}`;
    }

    if (mainDb) {
      summary += `, which stores data in ${mainDb.label.toLowerCase()}`;
    }

    if (edges.length > 0) {
      summary += `. Events flow between ${Math.min(edges.length, 3)} connection${edges.length > 1 ? "s" : ""} to keep everything in sync.`;
    }

    return summary + ".";
  }
}

export const geminiService = new GeminiService();
