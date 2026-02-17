# Task Reminder App

A task management app with Convex backend, React frontend, escalating push reminders, AI content generation (OpenRouter), and mobile-first dark/light UI.

## Setup

### 1. Configure Convex

```bash
npx convex dev
```

This will prompt you to log in and create a Convex project. After setup, add the deployment URL to `.env.local`:

```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 2. Environment Variables

**Convex** (set via `npx convex env set` or Dashboard):

- `OPENROUTER_API_KEY` - For AI content generation
- `VAPID_PUBLIC_KEY` - Web push (from `npx web-push generate-vapid-keys`)
- `VAPID_PRIVATE_KEY` - Web push private key

**Local** (`.env.local`):

- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_VAPID_PUBLIC_KEY` - Same as VAPID_PUBLIC_KEY (for client subscribe)

### 3. Run

```bash
npm run dev
```

Convex dev and Vite will run. Open the app in the browser.

## Features

- Tasks with due dates
- Snooze (15m, 30m, 1h, 2h) and escalating reminders
- Push notifications (enable in Settings)
- Channel config (Snapchat, TikTok, Instagram) for AI content
- Admin: list users, send test notification
- Dark/light theme

## Project Structure

- `convex/` - Backend (tasks, channels, push, agent, crons)
- `src/pages/` - Dashboard, TaskDetail, Settings, Admin
- `src/components/` - TaskList, TaskCard, TaskForm, SnoozeButtons, etc.
