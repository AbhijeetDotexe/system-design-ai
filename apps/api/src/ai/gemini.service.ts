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
  SYSTEM_DESIGN_MODIFY_PROMPT
} from "./gemini.prompts.js";
import { applyDagreLayout } from "../layout/dagre-layout.js";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (ENV.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
      logger.info(`[GeminiService] Initialized with model: ${ENV.GEMINI_MODEL}`);
    } else {
      logger.warn("[GeminiService] GEMINI_API_KEY not configured. Mock/Fallback mode active.");
    }
  }

  /**
   * Helper to execute Gemini model calls with retry on 503 transient spike
   */
  private async executeWithRetry(
    promptText: string,
    retries = 2,
    delayMs = 1500
  ): Promise<string> {
    if (!this.ai || !ENV.GEMINI_API_KEY) {
      throw new Error("No Gemini client configured");
    }

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: ENV.GEMINI_MODEL,
          contents: promptText
        });
        return response.text || "";
      } catch (err: any) {
        const is503 = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
        if (is503 && attempt <= retries) {
          logger.warn(`[GeminiService] Transient 503 from Gemini on attempt ${attempt}. Retrying in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs * attempt));
          continue;
        }
        throw err;
      }
    }
    return "";
  }

  /**
   * Generates a complete architecture diagram from a user description
   */
  async generateDiagram(prompt: string): Promise<DiagramDocument> {
    logger.info(`[GeminiService] Generating diagram for prompt: "${prompt.slice(0, 80)}..."`);

    let rawJsonText = "";

    if (this.ai && ENV.GEMINI_API_KEY) {
      try {
        const fullPrompt = `${SYSTEM_DESIGN_ARCHITECT_PROMPT}\n\nUser Request: ${prompt}\n\nGenerate the system architecture JSON:`;
        rawJsonText = await this.executeWithRetry(fullPrompt);
      } catch (err) {
        logger.error("[GeminiService] Gemini API call failed, falling back to intelligent heuristics:", err);
        rawJsonText = this.generateIntelligentFallback(prompt);
      }
    } else {
      rawJsonText = this.generateIntelligentFallback(prompt);
    }

    const parsed = this.safeParseAndValidate(rawJsonText, prompt);

    // Apply automatic layout (Dagre)
    const formattedNodes = parsed.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description || "",
      tech: n.tech || "",
      position: { x: n.position?.x || 0, y: n.position?.y || 0 },
      width: n.width || 180,
      height: n.height || 85
    }));

    const formattedEdges = parsed.edges.map((e, index) => ({
      id: e.id || `e-${index}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || "calls",
      type: e.type || "arrow"
    }));

    const layoutResult = applyDagreLayout(formattedNodes, formattedEdges, {
      direction: "LR",
      nodeSpacing: 70,
      rankSpacing: 100
    });

    return {
      title: parsed.title || "AI Generated Architecture",
      description: parsed.description || `Generated from prompt: "${prompt}"`,
      nodes: layoutResult.nodes,
      edges: layoutResult.edges,
      viewport: { x: 50, y: 50, zoom: 0.9 }
    };
  }

  /**
   * Modifies an existing architecture diagram according to an instruction
   */
  async modifyDiagram(instruction: string, currentDiagram: DiagramDocument): Promise<DiagramDocument> {
    logger.info(`[GeminiService] Modifying diagram with instruction: "${instruction}"`);

    let rawJsonText = "";

    if (this.ai && ENV.GEMINI_API_KEY) {
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
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      const validated = AiDiagramResponseSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
      logger.warn("[GeminiService] Zod validation issues in AI response, sanitizing:", validated.error.format());

      return {
        title: parsed.title || fallbackTitle || "System Architecture",
        description: parsed.description,
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges : []
      };
    } catch (parseError) {
      logger.error("[GeminiService] JSON parse error on AI response:", parseError, cleaned);
      throw new Error("Failed to parse AI response into structured architecture JSON");
    }
  }

  private generateIntelligentFallback(prompt: string): string {
    const lower = prompt.toLowerCase();
    const isFood = lower.includes("food") || lower.includes("delivery");
    const isInstagram = lower.includes("instagram") || lower.includes("photo") || lower.includes("social");

    if (isFood) {
      return JSON.stringify({
        title: "Scalable Food Delivery Architecture",
        description: "Event-driven system handling orders, drivers, restaurant dispatch, and real-time tracking.",
        nodes: [
          { id: "cust-app", type: "mobile", label: "Customer Mobile App", description: "Food ordering and live driver tracking", tech: "Flutter / React Native" },
          { id: "rest-portal", type: "browser", label: "Restaurant Portal", description: "Kitchen order management", tech: "React / Vite" },
          { id: "driver-app", type: "mobile", label: "Driver App", description: "GPS telemetry and order acceptance", tech: "Kotlin / Swift" },
          { id: "api-gw", type: "api_gateway", label: "Kong API Gateway", description: "Auth, rate limiting, and SSL termination", tech: "Kong" },
          { id: "order-svc", type: "microservice", label: "Order Service", description: "State machine for order lifecycle", tech: "Go / gRPC" },
          { id: "dispatch-svc", type: "microservice", label: "Dispatch & Matching", description: "Geospatial driver matching algorithm", tech: "Python / H3" },
          { id: "pay-svc", type: "microservice", label: "Payment Service", description: "Escrow and payouts", tech: "Node.js" },
          { id: "redis-geo", type: "redis", label: "Redis Geospatial Cache", description: "Live driver lat/long with GEOADD", tech: "Redis 7" },
          { id: "order-db", type: "postgresql", label: "PostgreSQL Database", description: "Transactional order data (ACID)", tech: "PostgreSQL 16" },
          { id: "kafka", type: "kafka", label: "Kafka Event Stream", description: "Order events, payment webhooks, dispatch triggers", tech: "Apache Kafka" },
          { id: "notif-svc", type: "microservice", label: "Notification Service", description: "Push alerts & SMS", tech: "Firebase FCM / Twilio" }
        ],
        edges: [
          { id: "e1", source: "cust-app", target: "api-gw", label: "HTTPS / REST" },
          { id: "e2", source: "rest-portal", target: "api-gw", label: "HTTPS / REST" },
          { id: "e3", source: "driver-app", target: "api-gw", label: "WebSocket / GPS" },
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
      return JSON.stringify({
        title: "Instagram-Scale Social Media Architecture",
        description: "Media-heavy social network supporting photo uploads, feed generation, and high-concurrency read traffic.",
        nodes: [
          { id: "client", type: "mobile", label: "Mobile Clients", description: "iOS / Android apps consuming feeds & posting", tech: "Swift / Kotlin" },
          { id: "cdn", type: "cdn", label: "Cloudflare CDN", description: "Caches image/video media at edge locations", tech: "Cloudflare" },
          { id: "lb", type: "load_balancer", label: "AWS ALB", description: "Distributes incoming traffic across clusters", tech: "AWS ALB" },
          { id: "api-gw", type: "api_gateway", label: "API Gateway", description: "Route handling, token verification, throttling", tech: "Envoy" },
          { id: "feed-svc", type: "microservice", label: "Feed Service", description: "Precomputes and serves home timelines", tech: "Go" },
          { id: "media-svc", type: "microservice", label: "Media Upload Service", description: "Processes images and video transcode jobs", tech: "Rust / FFmpeg" },
          { id: "user-svc", type: "microservice", label: "User & Graph Service", description: "Follower graphs and user profiles", tech: "Java / Spring" },
          { id: "redis-feed", type: "redis", label: "Redis Feed Cache", description: "Stores precomputed fan-out feeds in Sorted Sets", tech: "Redis Cluster" },
          { id: "s3-media", type: "storage", label: "S3 Media Storage", description: "Stores raw and compressed photos/videos", tech: "AWS S3" },
          { id: "postgres-main", type: "postgresql", label: "PostgreSQL Cluster", description: "Relational data for posts, likes, comments", tech: "Postgres + Patroni" },
          { id: "kafka", type: "kafka", label: "Kafka Event Bus", description: "Fan-out event stream on new posts", tech: "Kafka" }
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
          { id: "e9", source: "user-svc", target: "postgres-main", label: "Read / Write SQL" },
          { id: "e10", source: "media-svc", target: "kafka", label: "Publish PostCreated" },
          { id: "e11", source: "kafka", target: "feed-svc", label: "Async Fan-out Worker" }
        ]
      });
    }

    return JSON.stringify({
      title: "Scalable Distributed System Architecture",
      description: "Resilient high-throughput architecture with API Gateway, caching tier, primary database, and event streaming.",
      nodes: [
        { id: "client", type: "client", label: "Clients", description: "Web, Mobile, and IoT endpoints", tech: "React / Native" },
        { id: "cdn", type: "cdn", label: "CDN / Edge", description: "Static caching and DDoS mitigation", tech: "Cloudflare" },
        { id: "lb", type: "load_balancer", label: "Load Balancer", description: "Reverse proxy and SSL termination", tech: "NGINX" },
        { id: "api-gw", type: "api_gateway", label: "API Gateway", description: "Centralized routing and auth", tech: "Kong" },
        { id: "core-svc", type: "service", label: "Core Business Service", description: "Processes requests and business logic", tech: "Node.js / Go" },
        { id: "redis", type: "redis", label: "Redis Cache", description: "Sub-millisecond read caching", tech: "Redis 7" },
        { id: "database", type: "postgresql", label: "Primary Database", description: "ACID compliant persistent storage", tech: "PostgreSQL 16" },
        { id: "kafka", type: "kafka", label: "Kafka Event Bus", description: "Asynchronous task and event broker", tech: "Apache Kafka" },
        { id: "worker-svc", type: "microservice", label: "Async Worker Service", description: "Consumes background queue jobs", tech: "Python" },
        { id: "storage", type: "storage", label: "Object Storage", description: "Durable storage for files and backups", tech: "AWS S3" }
      ],
      edges: [
        { id: "e1", source: "client", target: "cdn", label: "HTTPS" },
        { id: "e2", source: "cdn", target: "lb", label: "Cache Miss" },
        { id: "e3", source: "lb", target: "api-gw", label: "Balance Load" },
        { id: "e4", source: "api-gw", target: "core-svc", label: "Route Request" },
        { id: "e5", source: "core-svc", target: "redis", label: "Read / Write Cache" },
        { id: "e6", source: "core-svc", target: "database", label: "Write SQL" },
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
}

export const geminiService = new GeminiService();
