import { NodeType } from "@systemcraft/diagram-schema";

export interface NodeCategory {
  title: string;
  items: {
    type: NodeType;
    label: string;
    description: string;
    tech: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }[];
}

export const ARCHITECTURE_CATEGORIES: NodeCategory[] = [
  {
    title: "Clients & Edge",
    items: [
      {
        type: "client",
        label: "Client App",
        description: "Frontend app users interact with — renders UI, handles local state, and sends API requests to backend services",
        tech: "React / Flutter",
        icon: "Monitor",
        color: "text-blue-400",
        bgColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3b82f6"
      },
      {
        type: "browser",
        label: "Web Browser",
        description: "Browser-based SPA or server-rendered app — delivers fast page loads, handles routing, and manages client-side caching",
        tech: "Next.js / Vue",
        icon: "Globe",
        color: "text-cyan-400",
        bgColor: "rgba(6, 182, 212, 0.1)",
        borderColor: "#06b6d4"
      },
      {
        type: "mobile",
        label: "Mobile App",
        description: "Native iOS/Android app — provides platform-specific UX, push notifications, offline support, and device hardware access",
        tech: "Swift / Kotlin",
        icon: "Smartphone",
        color: "text-sky-400",
        bgColor: "rgba(14, 165, 233, 0.1)",
        borderColor: "#0ea5e9"
      },
      {
        type: "cdn",
        label: "CDN / Edge",
        description: "Content delivery network — caches static assets at edge locations globally to reduce latency and absorb DDoS attacks",
        tech: "Cloudflare / CloudFront",
        icon: "Zap",
        color: "text-amber-400",
        bgColor: "rgba(245, 158, 11, 0.1)",
        borderColor: "#f59e0b"
      }
    ]
  },
  {
    title: "Networking & Gateways",
    items: [
      {
        type: "load_balancer",
        label: "Load Balancer",
        description: "Distributes incoming traffic across multiple servers — prevents overload, enables horizontal scaling, and provides health checks",
        tech: "NGINX / HAProxy / ALB",
        icon: "Network",
        color: "text-indigo-400",
        bgColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "#6366f1"
      },
      {
        type: "api_gateway",
        label: "API Gateway",
        description: "Single entry point for all client requests — handles routing, rate limiting, authentication, and request transformation",
        tech: "Kong / Envoy / Traefik",
        icon: "ShieldAlert",
        color: "text-violet-400",
        bgColor: "rgba(139, 92, 246, 0.1)",
        borderColor: "#8b5cf6"
      }
    ]
  },
  {
    title: "Compute & Services",
    items: [
      {
        type: "service",
        label: "Backend Service",
        description: "Core application server — implements business logic, processes requests, coordinates with databases and external services",
        tech: "Node.js / Go / Java",
        icon: "Server",
        color: "text-emerald-400",
        bgColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981"
      },
      {
        type: "microservice",
        label: "Microservice",
        description: "Independently deployable service owning a single domain — enables team autonomy, separate scaling, and fault isolation",
        tech: "gRPC / Spring Boot",
        icon: "Cpu",
        color: "text-teal-400",
        bgColor: "rgba(20, 184, 166, 0.1)",
        borderColor: "#14b8a6"
      },
      {
        type: "kubernetes",
        label: "Kubernetes Cluster",
        description: "Container orchestration platform — manages pod scheduling, auto-scaling, rolling deployments, and service discovery",
        tech: "K8s / EKS / GKE",
        icon: "Boxes",
        color: "text-blue-500",
        bgColor: "rgba(37, 99, 235, 0.1)",
        borderColor: "#2563eb"
      }
    ]
  },
  {
    title: "Data Stores & Caches",
    items: [
      {
        type: "postgresql",
        label: "PostgreSQL",
        description: "ACID-compliant relational database — stores structured data with strong consistency, supports complex queries and transactions",
        tech: "PostgreSQL 16",
        icon: "Database",
        color: "text-cyan-400",
        bgColor: "rgba(8, 145, 178, 0.1)",
        borderColor: "#0891b2"
      },
      {
        type: "mongodb",
        label: "MongoDB",
        description: "Document-oriented NoSQL database — stores flexible JSON-like documents, ideal for unstructured data and rapid schema evolution",
        tech: "MongoDB Atlas",
        icon: "Database",
        color: "text-green-500",
        bgColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "#22c55e"
      },
      {
        type: "redis",
        label: "Redis Cache",
        description: "In-memory key-value store — provides sub-millisecond reads for caching, session storage, rate limiting, and real-time leaderboards",
        tech: "Redis Cluster",
        icon: "Layers",
        color: "text-red-500",
        bgColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "#ef4444"
      },
      {
        type: "storage",
        label: "Object Storage",
        description: "Scalable blob/file storage — stores images, videos, backups, and large files with high durability and low cost",
        tech: "AWS S3 / GCS",
        icon: "HardDrive",
        color: "text-orange-400",
        bgColor: "rgba(249, 115, 22, 0.1)",
        borderColor: "#f97316"
      }
    ]
  },
  {
    title: "Messaging & Streaming",
    items: [
      {
        type: "kafka",
        label: "Kafka Stream",
        description: "Distributed event streaming platform — enables real-time data pipelines, event sourcing, and decoupled microservice communication",
        tech: "Apache Kafka",
        icon: "GitFork",
        color: "text-rose-400",
        bgColor: "rgba(244, 63, 94, 0.1)",
        borderColor: "#f43f5e"
      },
      {
        type: "rabbitmq",
        label: "RabbitMQ",
        description: "Message broker with AMQP protocol — queues tasks for async processing, ensures reliable delivery with retry and dead-letter support",
        tech: "RabbitMQ",
        icon: "MessageSquare",
        color: "text-amber-500",
        bgColor: "rgba(245, 158, 11, 0.1)",
        borderColor: "#f59e0b"
      }
    ]
  },
  {
    title: "Observability & Security",
    items: [
      {
        type: "auth",
        label: "Auth & Identity",
        description: "Identity provider — manages user authentication, authorization, OAuth2 flows, JWT tokens, and single sign-on across services",
        tech: "Keycloak / Auth0",
        icon: "KeyRound",
        color: "text-purple-400",
        bgColor: "rgba(168, 85, 247, 0.1)",
        borderColor: "#a855f7"
      },
      {
        type: "monitoring",
        label: "Monitoring & Logs",
        description: "Observability stack — collects metrics, traces, and logs to detect issues, track performance, and enable debugging across services",
        tech: "Prometheus / OTel",
        icon: "Activity",
        color: "text-pink-400",
        bgColor: "rgba(236, 72, 153, 0.1)",
        borderColor: "#ec4899"
      }
    ]
  }
];

export function getNodeStyle(type: NodeType) {
  for (const cat of ARCHITECTURE_CATEGORIES) {
    const item = cat.items.find((i) => i.type === type);
    if (item) return item;
  }
  return {
    type,
    label: "Custom Node",
    description: "System component",
    tech: "Custom",
    icon: "Box",
    color: "text-gray-400",
    bgColor: "rgba(100, 116, 139, 0.1)",
    borderColor: "#64748b"
  };
}
