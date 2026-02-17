# Task Reminder App

A task management app with Convex backend, React frontend, Convex Auth (email/password), escalating push reminders, AI content generation (OpenRouter + RAG), and mobile-first dark/light UI.

## Setup

### 1. Configure Convex

```bash
npx convex dev
```

### 2. Convex Auth (JWT keys)

Generate JWT keys for Convex Auth:

```bash
node generateKeys.mjs
```

Copy the output and add to Convex Dashboard **Environment Variables**:

- `JWT_PRIVATE_KEY` - from output
- `JWKS` - from output
- `SITE_URL` - e.g. `http://localhost:5173` (or your deployment URL)
- `ADMIN_EMAILS` - (optional) comma-separated emails for admin role, e.g. `admin@example.com`

### 3. Environment Variables

**Convex** (set via `npx convex env set` or Dashboard):

- `OPENROUTER_API_KEY` - For AI content generation
- `OPENAI_API_KEY` - For RAG embeddings (text-embedding-3-small)
- `VAPID_PUBLIC_KEY` - Web push (from `npx web-push generate-vapid-keys`)
- `VAPID_PRIVATE_KEY` - Web push private key

**Local** (`.env.local`):

- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_VAPID_PUBLIC_KEY` - Same as VAPID_PUBLIC_KEY (for client subscribe)

### 4. Run

```bash
npm run dev
```

## Features

- **Auth**: Sign in/up with email and password (Convex Auth)
- **Tasks**: Admin creates tasks for employees; escalating reminders (15m, 30m, 1h, 2h)
- **Push notifications**: Per-user, click opens task URL
- **Channels**: Snapchat, TikTok, Instagram for AI content
- **RAG**: Admin uploads PDF/MD/TXT as knowledge base for AI
- **Daily workflow**: Admin configures time; cron creates "Post to [channel] today" tasks and generates content
- **Admin panel**: Settings, Create Task, Users, Documents
- **Dark/light theme**

## Project Structure

- `convex/` - Backend (auth, tasks, channels, push, agent, admin, RAG, crons)
- `src/pages/` - Dashboard, TaskDetail, Settings, Admin, SignIn
