import { DiagramDocument } from "@systemcraft/diagram-schema";

export interface SystemTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  document: DiagramDocument;
}

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: "url-shortener",
    name: "Scalable URL Shortener",
    category: "Web & Microservices",
    description: "High-throughput URL shortener handling millions of redirects with Redis caching, PostgreSQL cluster, and Cassandra for analytics.",
    tags: ["Redis", "PostgreSQL", "Kafka", "Load Balancer"],
    document: {
      title: "Scalable URL Shortener Architecture",
      nodes: [
        {
          id: "client",
          type: "client",
          label: "Web / Mobile Clients",
          description: "End users requesting short URLs & creating links",
          position: { x: 50, y: 150 },
          width: 180,
          height: 80,
          tech: "React / Flutter"
        },
        {
          id: "dns-cdn",
          type: "cdn",
          label: "Cloudflare CDN / DNS",
          description: "Global edge caching for popular redirects",
          position: { x: 300, y: 150 },
          width: 180,
          height: 80,
          tech: "Cloudflare"
        },
        {
          id: "lb",
          type: "load_balancer",
          label: "NGINX Load Balancer",
          description: "SSL termination and round-robin traffic routing",
          position: { x: 550, y: 150 },
          width: 180,
          height: 80,
          tech: "NGINX"
        },
        {
          id: "api",
          type: "service",
          label: "API Gateway & Router",
          description: "Authentication, Rate limiting & URL redirection logic",
          position: { x: 800, y: 150 },
          width: 200,
          height: 90,
          tech: "Node.js / Go"
        },
        {
          id: "redis",
          type: "redis",
          label: "Redis Cache Cluster",
          description: "In-memory cache for top 20% hot URLs (80-20 rule)",
          position: { x: 1080, y: 50 },
          width: 190,
          height: 80,
          tech: "Redis Cluster"
        },
        {
          id: "db",
          type: "postgresql",
          label: "PostgreSQL Primary + Replica",
          description: "Persistent storage for URL mappings with B-Tree indices",
          position: { x: 1080, y: 180 },
          width: 210,
          height: 85,
          tech: "PostgreSQL 16"
        },
        {
          id: "kafka",
          type: "kafka",
          label: "Kafka Event Stream",
          description: "Asynchronous click event streaming for click tracking",
          position: { x: 1080, y: 310 },
          width: 190,
          height: 80,
          tech: "Apache Kafka"
        },
        {
          id: "analytics",
          type: "service",
          label: "Analytics Worker Service",
          description: "Aggregates click metrics, geolocation, and referrer stats",
          position: { x: 1350, y: 310 },
          width: 200,
          height: 80,
          tech: "Python / ClickHouse"
        }
      ],
      edges: [
        { id: "e1", source: "client", target: "dns-cdn", label: "HTTPS / GET /:slug" },
        { id: "e2", source: "dns-cdn", target: "lb", label: "Cache Miss" },
        { id: "e3", source: "lb", target: "api", label: "Upstream" },
        { id: "e4", source: "api", target: "redis", label: "1. Lookup Cache" },
        { id: "e5", source: "api", target: "db", label: "2. Read on Cache Miss" },
        { id: "e6", source: "api", target: "kafka", label: "3. Emit Click Event" },
        { id: "e7", source: "kafka", target: "analytics", label: "Stream Consume" }
      ],
      viewport: { x: 40, y: 40, zoom: 0.95 }
    }
  },
  {
    id: "ecommerce-system",
    name: "Modern E-Commerce Platform",
    category: "Microservices",
    description: "Event-driven microservices architecture with Order, Inventory, Payment, and Notification services.",
    tags: ["Microservices", "Event-Driven", "RabbitMQ", "MongoDB"],
    document: {
      title: "Event-Driven E-Commerce Architecture",
      nodes: [
        { id: "mobile-web", type: "client", label: "Buyer Web & Mobile", position: { x: 50, y: 200 }, width: 180, height: 80, tech: "Next.js / iOS" },
        { id: "api-gw", type: "api_gateway", label: "Kong API Gateway", position: { x: 300, y: 200 }, width: 180, height: 80, tech: "Kong / Envoy" },
        { id: "order-svc", type: "microservice", label: "Order Service", position: { x: 570, y: 80 }, width: 180, height: 80, tech: "Spring Boot" },
        { id: "pay-svc", type: "microservice", label: "Payment Service", position: { x: 570, y: 200 }, width: 180, height: 80, tech: "Go" },
        { id: "inv-svc", type: "microservice", label: "Inventory Service", position: { x: 570, y: 320 }, width: 180, height: 80, tech: "Node.js" },
        { id: "mq", type: "rabbitmq", label: "RabbitMQ Message Broker", position: { x: 840, y: 200 }, width: 190, height: 80, tech: "RabbitMQ" },
        { id: "notif-svc", type: "microservice", label: "Notification Service", position: { x: 1100, y: 140 }, width: 190, height: 80, tech: "NestJS" },
        { id: "order-db", type: "postgresql", label: "Orders PostgreSQL", position: { x: 840, y: 80 }, width: 180, height: 75, tech: "Postgres" },
        { id: "pay-gw", type: "external", label: "Stripe / PayPal Gateway", position: { x: 840, y: 320 }, width: 190, height: 75, tech: "Stripe API" }
      ],
      edges: [
        { id: "ec1", source: "mobile-web", target: "api-gw", label: "GraphQL / REST" },
        { id: "ec2", source: "api-gw", target: "order-svc", label: "/orders" },
        { id: "ec3", source: "api-gw", target: "pay-svc", label: "/checkout" },
        { id: "ec4", source: "api-gw", target: "inv-svc", label: "/catalog" },
        { id: "ec5", source: "order-svc", target: "order-db", label: "Persist Order" },
        { id: "ec6", source: "pay-svc", target: "pay-gw", label: "Process Charge" },
        { id: "ec7", source: "order-svc", target: "mq", label: "OrderCreated Event" },
        { id: "ec8", source: "mq", target: "notif-svc", label: "Send Email / SMS" }
      ],
      viewport: { x: 40, y: 40, zoom: 0.95 }
    }
  },
  {
    id: "realtime-chat",
    name: "Real-time Chat & Presence Engine",
    category: "Realtime",
    description: "Slack/Discord style real-time chat with WebSocket gateways, Redis PubSub, and Cassandra message history.",
    tags: ["WebSockets", "Redis PubSub", "Cassandra", "Presence"],
    document: {
      title: "Real-time Messaging Architecture",
      nodes: [
        { id: "clients", type: "client", label: "Chat Clients", position: { x: 50, y: 150 }, width: 180, height: 80, tech: "React / Electron" },
        { id: "ws-lb", type: "load_balancer", label: "WebSocket Balancer", position: { x: 300, y: 150 }, width: 180, height: 80, tech: "AWS ALB / NGINX" },
        { id: "ws-svc", type: "service", label: "WebSocket Gateway Cluster", position: { x: 560, y: 150 }, width: 210, height: 85, tech: "Node.js WS / Go" },
        { id: "pubsub", type: "redis", label: "Redis Pub/Sub & Presence", position: { x: 840, y: 60 }, width: 210, height: 85, tech: "Redis Cluster" },
        { id: "msg-db", type: "database", label: "Cassandra / ScyllaDB", position: { x: 840, y: 230 }, width: 210, height: 85, tech: "ScyllaDB NoSQL" },
        { id: "media-s3", type: "storage", label: "S3 Attachment Storage", position: { x: 840, y: 350 }, width: 210, height: 80, tech: "AWS S3 / Cloudflare R2" }
      ],
      edges: [
        { id: "c1", source: "clients", target: "ws-lb", label: "wss://" },
        { id: "c2", source: "ws-lb", target: "ws-svc", label: "Sticky Sessions" },
        { id: "c3", source: "ws-svc", target: "pubsub", label: "Publish / Subscribe" },
        { id: "c4", source: "ws-svc", target: "msg-db", label: "Write Message Log" },
        { id: "c5", source: "ws-svc", target: "media-s3", label: "Upload Images" }
      ],
      viewport: { x: 40, y: 40, zoom: 0.95 }
    }
  }
];
