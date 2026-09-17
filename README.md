# SystemCraft AI — Visual System Design & Architecture Platform

A production-grade MERN stack web application inspired by Excalidraw, engineered specifically for distributed software architecture and system design diagramming with Google Gemini AI.

---

## Key Features

1. **AI System Architecture Generation**:
   - Natural language to structured, production-grade distributed architectures.
   - Infers required clients, API gateways, load balancers, microservices, caches (Redis), relational & NoSQL databases (PostgreSQL, MongoDB), messaging streams (Kafka, RabbitMQ), object storage (S3), and observability.
   - Server-side validation via Zod schemas before rendering.
2. **Contextual AI Editing & Refinements**:
   - Floating `Ask AI` assistant that modifies current diagrams (e.g., *"Add Redis caching between API and PostgreSQL"*).
   - Preserves existing nodes while adding and rewiring new infrastructure components.
3. **Dedicated System Component Palette**:
   - Categorized by Clients & Edge, Networking & Gateways, Compute & Microservices, Data Stores & Caches, Messaging & Streaming, Observability & Security.
   - Interactive drag-and-drop onto the canvas.
4. **Automatic Graph Layout**:
   - Integrated Dagre graph layout engine automatically positions and routes multi-tier architectures without overlapping nodes or tangled edges.
5. **Interactive Diagram Canvas**:
   - Smooth pan & zoom (wheel + trackpad pinch), multi-select, drag-to-reposition.
   - Connector ports for drawing relationship links with labels and arrowheads.
   - Undo/Redo history stack with shortcut keybindings.
6. **Production-Ready Features**:
   - JWT authentication (secure cookies & Authorization bearer token).
   - Automatic debounced autosave (`Saving...` → `Saved ✓`).
   - Version history and instant restore capability.
   - Public read-only sharing via unique tokens.
   - Multi-format export: PNG, SVG, and structured JSON.
   - Interactive Diagram JSON Inspector & Editor with live validation.
   - Curated starter templates (URL Shortener, E-Commerce Platform, Real-time Chat & Presence).

---

## Monorepo Structure

```text
systemAi/
├── apps/
│   ├── api/                 # Express.js + Mongoose + TypeScript layered backend
│   │   ├── src/
│   │   │   ├── ai/          # Gemini API client, prompts, and schema validation
│   │   │   ├── config/      # Env config, DB connection, rate limits
│   │   │   ├── controllers/ # Auth, Diagrams, AI, Share controllers
│   │   │   ├── layout/      # Dagre auto-layout engine
│   │   │   ├── middleware/  # JWT auth, Zod error handler, rate-limiter
│   │   │   ├── models/      # User, Diagram, DiagramVersion Mongoose models
│   │   │   ├── routes/      # REST API route endpoints
│   │   │   └── server.ts
│   └── web/                 # React 18 + Vite + Tailwind CSS + Zustand + TanStack Query
│       ├── src/
│       │   ├── features/    # Canvas, Toolbar, Sidebar, PropertiesPanel, AI Modal
│       │   ├── pages/       # LandingPage, AuthPage, DashboardPage, EditorPage, ShareViewPage
│       │   ├── stores/      # Editor state, Auth state (Zustand)
│       │   └── App.tsx
├── packages/
│   ├── diagram-schema/      # Shared Zod schemas & TypeScript types for nodes, edges, docs
│   └── shared/              # API contracts, DTO schemas, system design templates
├── docker-compose.yml       # Production multi-container setup (MongoDB, API, Web)
└── pnpm-workspace.yaml
```

---

## Getting Started Locally

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- MongoDB running locally on `localhost:27017` (or via Docker)

### 1. Installation
```bash
pnpm install
```

### 2. Environment Configuration
Copy the `.env.example` file to `apps/api/.env`:
```bash
cp .env.example apps/api/.env
```

Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/systemcraft
JWT_SECRET=super_secret_jwt_key_systemcraft_development_mode
CLIENT_URL=http://localhost:5173

# Optional: Set your Google Gemini API Key for live AI generation
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Note**: Even without a Gemini API key, the application includes an intelligent architectural heuristic engine that seamlessly generates realistic distributed systems for common patterns (Food Delivery, Social Media, URL Shortener, Microservices).

### 3. Build Shared Packages & Applications
```bash
pnpm build
```

### 4. Run Development Servers
```bash
# In one terminal or concurrently:
pnpm dev
```
Or run individually:
- Backend API: `pnpm --filter @systemcraft/api dev` (Runs on http://localhost:5000)
- Frontend Web: `pnpm --filter @systemcraft/web dev` (Runs on http://localhost:5173)

---

## Running with Docker Compose

```bash
docker-compose up --build
```
This boots:
- MongoDB at `localhost:27017`
- SystemCraft API at `localhost:5000`
- SystemCraft Web at `localhost:5173`

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Undo** | `Ctrl` / `Cmd` + `Z` |
| **Redo** | `Ctrl` / `Cmd` + `Shift` + `Z` |
| **Save** | `Ctrl` / `Cmd` + `S` |
| **Duplicate Selected** | `Ctrl` / `Cmd` + `D` |
| **Delete Component** | `Backspace` / `Delete` |
| **Pan Canvas** | Mouse Wheel / Space + Drag |
| **Zoom Canvas** | `Ctrl` + Mouse Wheel / `+` / `-` |
| **Multi-Select** | `Shift` + Click |
