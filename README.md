<div align="center">

# 🧠 Coremind

**A modern developer tool that blends AI assistance directly into your workflow, helping you write, refactor, and understand code faster.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-886FBF?logo=googlegemini&logoColor=white)](https://ai.google.dev/)

</div>

---

## 📖 Overview

Coremind is a full-stack AI-powered developer tool featuring both a **web dashboard** and a **CLI application**. It leverages Google's Gemini AI to provide intelligent chat, code execution, and web search capabilities — all accessible from your terminal or browser.

### ✨ Key Features

- 🔐 **Secure Authentication** — GitHub OAuth with device flow for seamless CLI login
- 💬 **AI Chat** — Conversational AI powered by Google Gemini with persistent chat history
- 🛠️ **Built-in Tools** — Google Search, Code Execution, and URL Context analysis
- 🤖 **Agent Mode** — Advanced autonomous AI agent *(coming soon)*
- 📝 **Markdown Rendering** — Beautiful markdown output in both terminal and web
- 💾 **Conversation History** — All chats are stored in PostgreSQL for easy retrieval

---

## 🏗️ Architecture

```
Coremind/
├── client/          # Next.js 16 web application (React 19)
│   ├── app/         # App router pages (auth, device flow, dashboard)
│   ├── components/  # UI components (shadcn/ui)
│   ├── lib/         # Auth client & utilities
│   └── hooks/       # Custom React hooks
│
├── server/          # Express.js API server & CLI
│   ├── src/
│   │   ├── cli/     # CLI application (Commander.js)
│   │   │   ├── ai/          # Google AI service
│   │   │   ├── chat/        # Chat & tool chat handlers
│   │   │   └── commands/    # CLI commands (auth, ai)
│   │   ├── config/  # AI model & tool configuration
│   │   ├── service/ # Business logic (chat service)
│   │   └── server.ts
│   ├── lib/         # Auth, Prisma, token management
│   ├── prisma/      # Database schema & migrations
│   └── generated/   # Prisma generated client
```

---

## ⚙️ Tech Stack

| Layer        | Technology                                                   |
| ------------ | ------------------------------------------------------------ |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui             |
| **Backend**  | Express.js 5, TypeScript, Node.js                            |
| **Database** | PostgreSQL, Prisma ORM 7                                     |
| **Auth**     | Better Auth (GitHub OAuth + Device Authorization Flow)       |
| **AI**       | Google Gemini (via Vercel AI SDK)                             |
| **CLI**      | Commander.js, Clack Prompts, Chalk, Boxen, Marked (terminal) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database
- **GitHub OAuth App** (for authentication)
- **Google AI API Key** (for Gemini)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/coremind.git
cd coremind
```

### 2. Set Up the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/coremind"

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
COREMIND_MODEL=gemini-2.5-flash
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the server:

```bash
npm run dev
```

### 3. Set Up the Client

```bash
cd client
npm install
npm run dev
```

The web app will be available at **http://localhost:3000**.

---

## 🖥️ CLI Usage

Coremind ships with a powerful CLI for AI-assisted development right from your terminal.

### Installation

```bash
cd server
npm run build
npm link
```

> ⚠️ **Important:** You must run `npm run build` before using the CLI. TypeScript is not directly supported in CLI applications, so the project needs to be compiled to JavaScript first.

> 🔧 **Troubleshooting:**
>
> - If the CLI throws an error saying a certain environment variable is not set, you can set it directly in your terminal:
>
>   **PowerShell:**
>
>   ```powershell
>   $env:VARIABLE_NAME="your_value"
>   ```
>
>   **Bash / Zsh:**
>
>   ```bash
>   export VARIABLE_NAME="your_value"
>   ```
>
>   For example, if `GOOGLE_GENERATIVE_AI_API_KEY` is missing:
>
>   ```powershell
>   $env:GOOGLE_GENERATIVE_AI_API_KEY="YOUR_API_KEY"
>   coremind
>   ```
>
> - If you are unable to login, pass your GitHub OAuth Client ID explicitly:
>
>   ```bash
>   coremind login --client-id YOUR_GITHUB_CLIENT_ID
>   ```

### Commands

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `coremind login`   | Authenticate via GitHub (device flow) |
| `coremind logout`  | Sign out and clear stored tokens  |
| `coremind whoami`  | Display current authenticated user |
| `coremind wakeup`  | Launch AI chat session            |

### Example

```bash
# Authenticate
coremind login

# Start an AI chat session
coremind wakeup
```

Once inside `wakeup`, you can choose from:

- 💬 **Chat with AI** — Free-form conversation
- 🛠️ **Use Tools** — Leverage Google Search, Code Execution, or URL analysis
- 🤖 **Agent Mode** — Autonomous AI agent *(coming soon)*

---

## 🔐 Authentication Flow

Coremind uses the **OAuth 2.0 Device Authorization Grant** for CLI authentication:

```
┌──────────┐                        ┌──────────┐                     ┌──────────┐
│   CLI    │  1. Request device code │  Server  │                     │  GitHub  │
│          │ ─────────────────────►  │          │                     │          │
│          │  2. Display user code   │          │                     │          │
│          │ ◄─────────────────────  │          │                     │          │
│          │                         │          │                     │          │
│          │  3. User opens browser  │   Web    │  4. GitHub OAuth    │          │
│          │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ► │  Client  │ ──────────────────► │          │
│          │                         │          │ ◄────────────────── │          │
│          │  5. Poll for token      │          │                     │          │
│          │ ─────────────────────►  │  Server  │                     │          │
│          │  6. Access token        │          │                     │          │
│          │ ◄─────────────────────  │          │                     │          │
└──────────┘                        └──────────┘                     └──────────┘
```

---

## 📁 Database Schema

The application uses the following core models:

- **User** — Authenticated users (GitHub OAuth)
- **Session** — Active user sessions & tokens
- **Account** — Linked OAuth provider accounts
- **Conversation** — Chat sessions (chat / tool / agent modes)
- **Message** — Individual messages within conversations
- **DeviceCode** — OAuth device flow authorization codes

---

## 🧪 Scripts

### Server

| Script             | Description                  |
| ------------------ | ---------------------------- |
| `npm run dev`      | Start dev server (nodemon)   |
| `npm run build`    | Compile TypeScript            |
| `npm run start`    | Start production server       |
| `npm run format`   | Format code with Prettier     |

### Client

| Script             | Description                  |
| ------------------ | ---------------------------- |
| `npm run dev`      | Start Next.js dev server      |
| `npm run build`    | Build for production          |
| `npm run start`    | Start production server       |
| `npm run lint`     | Run ESLint                    |
| `npm run format`   | Format code with Prettier     |

---

## 🛠️ AI Tools

Coremind supports extensible AI tools powered by Google Gemini:

| Tool               | Description                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| 🔍 **Google Search** | Access real-time information from the web                               |
| 💻 **Code Execution** | Generate and execute Python code for calculations and problem-solving  |
| 🌐 **URL Context**   | Analyze and extract information from up to 20 URLs per request         |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<div align="center">

**Built with ❤️ by [Coremind](https://github.com/<your-username>/coremind)**

</div>

