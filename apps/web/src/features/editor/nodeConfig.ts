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
        description: "Web, Mobile, or Desktop Client",
        tech: "React / Flutter",
        icon: "Monitor",
        color: "text-blue-400",
        bgColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3b82f6"
      },
      {
        type: "browser",
        label: "Web Browser",
        description: "Browser SPA or SSR",
        tech: "Next.js / Vue",
        icon: "Globe",
        color: "text-cyan-400",
        bgColor: "rgba(6, 182, 212, 0.1)",
        borderColor: "#06b6d4"
      },
      {
        type: "mobile",
        label: "Mobile App",
        description: "iOS / Android Native",
        tech: "Swift / Kotlin",
        icon: "Smartphone",
        color: "text-sky-400",
        bgColor: "rgba(14, 165, 233, 0.1)",
        borderColor: "#0ea5e9"
      },
      {
        type: "cdn",
        label: "CDN / Edge",
        description: "Edge caching & DDoS mitigation",
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
        description: "L4/L7 Traffic Distributor",
        tech: "NGINX / HAProxy / ALB",
        icon: "Network",
        color: "text-indigo-400",
        bgColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "#6366f1"
      },
      {
        type: "api_gateway",
        label: "API Gateway",
        description: "Routing, rate limiting, token validation",
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
        description: "Core application business service",
        tech: "Node.js / Go / Java",
        icon: "Server",
        color: "text-emerald-400",
        bgColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981"
      },
      {
        type: "microservice",
        label: "Microservice",
        description: "Autonomous bounded context service",
        tech: "gRPC / Spring Boot",
        icon: "Cpu",
        color: "text-teal-400",
        bgColor: "rgba(20, 184, 166, 0.1)",
        borderColor: "#14b8a6"
      },
      {
        type: "kubernetes",
        label: "Kubernetes Cluster",
        description: "Container orchestration pods & daemonsets",
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
        description: "ACID Relational database cluster",
        tech: "PostgreSQL 16",
        icon: "Database",
        color: "text-cyan-400",
        bgColor: "rgba(8, 145, 178, 0.1)",
        borderColor: "#0891b2"
      },
      {
        type: "mongodb",
        label: "MongoDB",
        description: "Document NoSQL database",
        tech: "MongoDB Atlas",
        icon: "Database",
        color: "text-green-500",
        bgColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "#22c55e"
      },
      {
        type: "redis",
        label: "Redis Cache",
        description: "In-memory caching and data structures",
        tech: "Redis Cluster",
        icon: "Layers",
        color: "text-red-500",
        bgColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "#ef4444"
      },
      {
        type: "storage",
        label: "Object Storage",
        description: "Scalable durable blob/file storage",
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
        description: "Distributed commit log & pub/sub",
        tech: "Apache Kafka",
        icon: "GitFork",
        color: "text-rose-400",
        bgColor: "rgba(244, 63, 94, 0.1)",
        borderColor: "#f43f5e"
      },
      {
        type: "rabbitmq",
        label: "RabbitMQ",
        description: "Message broker with AMQP exchange",
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
        description: "OAuth2, JWT & SSO Identity Provider",
        tech: "Keycloak / Auth0",
        icon: "KeyRound",
        color: "text-purple-400",
        bgColor: "rgba(168, 85, 247, 0.1)",
        borderColor: "#a855f7"
      },
      {
        type: "monitoring",
        label: "Monitoring & Logs",
        description: "Prometheus, Grafana & ELK Stack",
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
