<div align="center">

# 🧠 Coremind — System Design

**High-level architecture, data flow, and entity-relationship diagrams**

</div>

---

## 🏗️ System Architecture

```mermaid
flowchart TB
  subgraph CLIENT["🖥️ Client Layer"]
    direction LR
    WEB["<b>Web Dashboard</b><br/>Next.js 16 · React 19<br/>Tailwind CSS 4 · shadcn/ui"]
    CLI["<b>CLI Application</b><br/>Commander.js · Clack Prompts<br/>Chalk · Boxen · Marked"]
  end

  subgraph SERVER["⚙️ Server Layer — Express.js 5 + TypeScript"]
    direction TB
    API["<b>REST API</b><br/>Express.js 5<br/>Route Handlers · Middleware"]

    subgraph AUTH["🔐 Auth Module"]
      direction LR
      BA["<b>Better Auth</b><br/>Session Management<br/>Token Rotation"]
      DEVICE["<b>Device Flow</b><br/>OAuth 2.0 RFC 8628<br/>Code Polling"]
    end

    subgraph AI_ENGINE["🤖 AI Engine"]
      direction TB
      GEMINI["<b>Google Gemini</b><br/>via Vercel AI SDK<br/>Structured Output · Zod Schemas"]

      subgraph TOOLS["🛠️ Tool Orchestration"]
        direction LR
        GS["🔍 Google<br/>Search"]
        CE["💻 Code<br/>Execution"]
        UC["🌐 URL<br/>Context"]
      end

      subgraph MODES["💬 Chat Modes"]
        direction LR
        CHAT["Chat"]
        TOOL["Tool Use"]
        AGENT["Agent<br/>Mode"]
      end

      GEMINI --> TOOLS
      GEMINI --> MODES
    end

    subgraph SERVICES["📦 Service Layer"]
      CHAT_SVC["<b>Chat Service</b><br/>Conversation CRUD<br/>Message Persistence"]
      AGENT_SVC["<b>Agent Service</b><br/>App Scaffolding<br/>File Generation"]
    end

    API --> AUTH
    API --> AI_ENGINE
    API --> SERVICES
  end

  subgraph DATA["🗄️ Data Layer"]
    direction LR
    PRISMA["<b>Prisma ORM 7</b><br/>Generated Client<br/>Migrations"]
    PG[("  <b>PostgreSQL 16</b>  <br/>Users · Sessions<br/>Conversations · Messages<br/>Accounts · DeviceCodes")]
    PRISMA --> PG
  end

  subgraph EXTERNAL["☁️ External Services"]
    direction LR
    GITHUB["<b>GitHub OAuth</b><br/>Provider"]
    GOOGLE_AI["<b>Google AI</b><br/>Gemini API"]
  end

  subgraph INFRA["🐳 Infrastructure — Docker Compose"]
    direction LR
    DC_CLIENT["client<br/>:3000"]
    DC_SERVER["server<br/>:5000"]
    DC_DB["postgres<br/>:5432"]
    DC_CLIENT --> DC_SERVER --> DC_DB
  end

  WEB -->|"HTTPS :3000"| API
  CLI -->|"HTTP :5000"| API
  AUTH --> GITHUB
  AI_ENGINE --> GOOGLE_AI
  SERVICES --> PRISMA

  style CLIENT fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
  style SERVER fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#f8fafc
  style AUTH fill:#1e1b4b,stroke:#a78bfa,stroke-width:1px,color:#e0e7ff
  style AI_ENGINE fill:#162044,stroke:#60a5fa,stroke-width:1px,color:#dbeafe
  style TOOLS fill:#1a2744,stroke:#38bdf8,stroke-width:1px,color:#bae6fd
  style MODES fill:#1a2744,stroke:#38bdf8,stroke-width:1px,color:#bae6fd
  style SERVICES fill:#172554,stroke:#93c5fd,stroke-width:1px,color:#dbeafe
  style DATA fill:#0c1a0c,stroke:#4ade80,stroke-width:2px,color:#f0fdf4
  style EXTERNAL fill:#2a1708,stroke:#fb923c,stroke-width:2px,color:#fff7ed
  style INFRA fill:#1c1917,stroke:#a8a29e,stroke-width:2px,color:#fafaf9

  style WEB fill:#0ea5e9,stroke:#0284c7,color:#fff
  style CLI fill:#8b5cf6,stroke:#7c3aed,color:#fff
  style API fill:#6366f1,stroke:#4f46e5,color:#fff
  style BA fill:#7c3aed,stroke:#6d28d9,color:#fff
  style DEVICE fill:#7c3aed,stroke:#6d28d9,color:#fff
  style GEMINI fill:#3b82f6,stroke:#2563eb,color:#fff
  style GS fill:#0ea5e9,stroke:#0284c7,color:#fff
  style CE fill:#0ea5e9,stroke:#0284c7,color:#fff
  style UC fill:#0ea5e9,stroke:#0284c7,color:#fff
  style CHAT fill:#3b82f6,stroke:#2563eb,color:#fff
  style TOOL fill:#3b82f6,stroke:#2563eb,color:#fff
  style AGENT fill:#3b82f6,stroke:#2563eb,color:#fff
  style CHAT_SVC fill:#6366f1,stroke:#4f46e5,color:#fff
  style AGENT_SVC fill:#6366f1,stroke:#4f46e5,color:#fff
  style PRISMA fill:#22c55e,stroke:#16a34a,color:#fff
  style PG fill:#16a34a,stroke:#15803d,color:#fff
  style GITHUB fill:#f97316,stroke:#ea580c,color:#fff
  style GOOGLE_AI fill:#f97316,stroke:#ea580c,color:#fff
  style DC_CLIENT fill:#78716c,stroke:#57534e,color:#fff
  style DC_SERVER fill:#78716c,stroke:#57534e,color:#fff
  style DC_DB fill:#78716c,stroke:#57534e,color:#fff
```

---

## 🔐 Authentication Flow — OAuth 2.0 Device Authorization Grant (RFC 8628)

```mermaid
sequenceDiagram
    participant CLI as 🖥️ CLI Client
    participant Server as ⚙️ Express API
    participant Web as 🌐 Web Dashboard
    participant GitHub as 🐙 GitHub OAuth
    participant DB as 🗄️ PostgreSQL

    Note over CLI,DB: Device Authorization Flow

    CLI->>Server: POST /device/code
    Server->>DB: Create DeviceCode record
    Server-->>CLI: { device_code, user_code, verification_uri }

    CLI->>CLI: Display user_code to terminal
    Note right of CLI: User opens browser manually

    Web->>GitHub: GET /login/oauth/authorize
    GitHub-->>Web: Authorization callback
    Web->>Server: POST /auth/callback (auth_code)
    Server->>GitHub: Exchange code for access_token
    GitHub-->>Server: { access_token, user_profile }
    Server->>DB: Create/Update User, Account, Session
    Server->>DB: Update DeviceCode (status → approved)

    loop Poll every 5 seconds
        CLI->>Server: POST /device/token (device_code)
        Server->>DB: Check DeviceCode status
    end

    Server-->>CLI: { access_token, session }
    CLI->>CLI: Store token locally

    Note over CLI,DB: ✅ CLI Authenticated
```

---

## 🤖 AI Chat & Tool Pipeline

```mermaid
flowchart LR
    subgraph INPUT["📥 User Input"]
        USER_MSG["User Message"]
    end

    subgraph ROUTING["🔀 Mode Router"]
        direction TB
        CHAT_MODE["💬 Chat Mode<br/><i>Free conversation</i>"]
        TOOL_MODE["🛠️ Tool Mode<br/><i>Augmented generation</i>"]
        AGENT_MODE["🤖 Agent Mode<br/><i>Autonomous scaffolding</i>"]
    end

    subgraph AI_LAYER["🧠 AI Processing"]
        direction TB
        GEMINI_API["Google Gemini<br/>via Vercel AI SDK"]
        STREAM["streamText()"]
        STRUCT["generateObject()<br/>+ Zod Schema"]
    end

    subgraph TOOL_LAYER["🔧 Tool Execution"]
        direction TB
        GOOGLE_SEARCH["🔍 Google Search<br/><i>Real-time web data</i>"]
        CODE_EXEC["💻 Code Execution<br/><i>Python sandbox</i>"]
        URL_CTX["🌐 URL Context<br/><i>Up to 20 URLs</i>"]
    end

    subgraph OUTPUT["📤 Response"]
        direction TB
        MARKDOWN["Markdown Render<br/><i>Terminal + Web</i>"]
        FILE_GEN["File Generation<br/><i>Agent output</i>"]
        PERSIST["💾 Persist to DB<br/><i>Conversation + Messages</i>"]
    end

    USER_MSG --> ROUTING
    CHAT_MODE --> STREAM
    TOOL_MODE --> STREAM
    AGENT_MODE --> STRUCT
    STREAM --> GEMINI_API
    STRUCT --> GEMINI_API
    GEMINI_API --> TOOL_LAYER
    TOOL_LAYER --> GEMINI_API
    GEMINI_API --> MARKDOWN
    STRUCT --> FILE_GEN
    MARKDOWN --> PERSIST
    FILE_GEN --> PERSIST

    style INPUT fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style ROUTING fill:#1e1b4b,stroke:#a78bfa,stroke-width:2px,color:#e0e7ff
    style AI_LAYER fill:#162044,stroke:#60a5fa,stroke-width:2px,color:#dbeafe
    style TOOL_LAYER fill:#2a1708,stroke:#fb923c,stroke-width:2px,color:#fff7ed
    style OUTPUT fill:#0c1a0c,stroke:#4ade80,stroke-width:2px,color:#f0fdf4

    style USER_MSG fill:#0ea5e9,stroke:#0284c7,color:#fff
    style CHAT_MODE fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style TOOL_MODE fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style AGENT_MODE fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style GEMINI_API fill:#3b82f6,stroke:#2563eb,color:#fff
    style STREAM fill:#6366f1,stroke:#4f46e5,color:#fff
    style STRUCT fill:#6366f1,stroke:#4f46e5,color:#fff
    style GOOGLE_SEARCH fill:#f97316,stroke:#ea580c,color:#fff
    style CODE_EXEC fill:#f97316,stroke:#ea580c,color:#fff
    style URL_CTX fill:#f97316,stroke:#ea580c,color:#fff
    style MARKDOWN fill:#22c55e,stroke:#16a34a,color:#fff
    style FILE_GEN fill:#22c55e,stroke:#16a34a,color:#fff
    style PERSIST fill:#16a34a,stroke:#15803d,color:#fff
```

---

## 📁 Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string name
        boolean emailVerified
        string image
        datetime createdAt
        datetime updatedAt
    }

    SESSION {
        string id PK
        datetime expiresAt
        string token UK
        string ipAddress
        string userAgent
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    ACCOUNT {
        string id PK
        string accountId
        string providerId
        string userId FK
        string accessToken
        string refreshToken
        string idToken
        datetime accessTokenExpiresAt
        datetime refreshTokenExpiresAt
        string scope
        datetime createdAt
        datetime updatedAt
    }

    CONVERSATION {
        string id PK
        string userId FK
        string title
        string mode
        datetime createdAt
        datetime updatedAt
    }

    MESSAGE {
        string id PK
        string conversationId FK
        string role
        string content
        datetime createdAt
        datetime updatedAt
    }

    DEVICE_CODE {
        string id PK
        string deviceCode
        string userCode
        string userId
        datetime expiresAt
        string status
        datetime lastPolledAt
        int pollingInterval
        string clientId
        string scope
    }

    USER ||--o{ SESSION : "has"
    USER ||--o{ ACCOUNT : "has"
    USER ||--o{ CONVERSATION : "owns"
    CONVERSATION ||--o{ MESSAGE : "contains"
```

---

## 🐳 Docker Compose Topology

```mermaid
flowchart LR
    subgraph DOCKER["Docker Compose Network"]
        direction LR
        CLIENT_C["🌐 client<br/>Next.js 16<br/><b>:3000</b>"]
        SERVER_C["⚙️ server<br/>Express.js 5<br/><b>:5000</b>"]
        DB_C[("🗄️ postgres<br/>PostgreSQL 16 Alpine<br/><b>:5432</b>")]

        CLIENT_C -->|"depends_on"| SERVER_C
        SERVER_C -->|"depends_on"| DB_C
    end

    BROWSER["🧑‍💻 Browser"] -->|":3000"| CLIENT_C
    TERMINAL["🖥️ Terminal"] -->|":5000"| SERVER_C

    VOLUME[("📦 pgdata<br/><i>Persistent Volume</i>")] -.-|"mount"| DB_C

    style DOCKER fill:#1c1917,stroke:#a8a29e,stroke-width:2px,color:#fafaf9
    style CLIENT_C fill:#0ea5e9,stroke:#0284c7,color:#fff
    style SERVER_C fill:#6366f1,stroke:#4f46e5,color:#fff
    style DB_C fill:#16a34a,stroke:#15803d,color:#fff
    style BROWSER fill:#f97316,stroke:#ea580c,color:#fff
    style TERMINAL fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style VOLUME fill:#78716c,stroke:#57534e,color:#fff
```

---

<div align="center">

**🧠 Coremind** — AI-native developer tooling, engineered for the modern stack.

</div>

