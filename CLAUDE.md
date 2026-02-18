# CLAUDE.md – BuJo+GTD Todo App

## Project Overview
Czech-language BuJo (Bullet Journal) + GTD (Getting Things Done) task management app designed for ADHD users. Emphasizes minimal friction, overwhelm prevention, and dopamine rewards.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui components, dark mode via `next-themes`
- **State:** TanStack React Query (server state), Zustand (UI + sync stores)
- **Database:** SQLite (dev) via Prisma ORM, Dexie.js (IndexedDB for offline)
- **Auth:** NextAuth v5 beta (JWT strategy, credentials provider)
- **DnD:** @dnd-kit/core + @dnd-kit/sortable
- **Other:** rrule (recurring tasks), canvas-confetti, sonner (toasts), cmdk (command palette), date-fns, lucide-react icons

## Commands
```bash
cd /home/claude/bujo-app
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint
npx prisma studio # Browse database
npx prisma db push # Push schema changes (SQLite)
npx prisma generate # Regenerate Prisma client after schema change
```

## Project Structure
```
/home/claude/bujo-app/
  app/
    (app)/          # Authenticated app routes (protected by middleware)
      today/        # Main daily view (default after login)
      upcoming/     # Week/month overview
      backlog/      # Unscheduled tasks
      archive/      # BuJo day archive (read-only)
      contexts/     # Context filtered views
      templates/    # Template management
      settings/     # User preferences
      layout.tsx    # App shell (sidebar + main)
    (auth)/         # Auth routes (login, register, onboarding)
    api/            # REST API route handlers
    providers.tsx   # SessionProvider, QueryClient, ThemeProvider, Toaster, OnlineStatusListener
    globals.css     # Tailwind + shadcn theme variables (light/dark)
  components/
    ui/             # shadcn/ui base components
    tasks/          # TaskItem, TaskList, TaskDetail, TaskContextGroup, InlineAddTask, QuickAdd, SubtaskList, TaskFilters, TaskItemSkeleton
    inbox/          # InboxProcessing (Tinder-style), ProcessDialog
    daylog/         # DayEndReview, UnclosedDaysReview, WeeklySummary, DayArchiveView, DayCalendarNav, SignifierIcon
    feedback/       # ConfettiAnimation, EncouragingToast, ProgressBar, UndoToast
    focus/          # FocusMode
    layout/         # Sidebar, BottomNav, SearchDialog, SyncIndicator
    contexts/       # ContextBadge, ContextManager
    templates/      # TemplateManager, TemplateActivate
    onboarding/     # OnboardingFlow, ContextTemplateSelector
  lib/
    auth.ts         # NextAuth config (JWT, credentials)
    auth-helpers.ts # Auth utility functions
    prisma.ts       # Prisma client singleton
    types.ts        # Shared TS types (re-exports Prisma types + app-specific)
    utils.ts        # cn() and other utilities
    db.ts           # Dexie.js IndexedDB schema (mirrors Prisma)
    sync.ts         # Sync logic (push/pull)
    operationQueue.ts # Offline operation queue
    daylog-helpers.ts # DayLog business logic helpers
    query-client.ts # TanStack Query client setup
    hooks/
      use-tasks.ts    # CRUD + reorder mutations with offline fallback
      use-daylog.ts   # DayLog open/close/review/reorder hooks
      use-contexts.ts # Context CRUD + reorder with offline fallback
    stores/
      ui-store.ts     # Zustand: sidebar, focus mode, quick add, search, task detail
      sync-store.ts   # Zustand: online status, syncing, pending ops count
  prisma/
    schema.prisma   # Data model (source of truth)
    dev.db          # SQLite dev database
```

## Data Model (Key Entities)
- **Task** – status: `inbox|today|scheduled|backlog|done|cancelled`. Always has a contextId.
- **Subtask** – Single-level checklist items on a Task.
- **Context** – GTD contexts (@work, @home...). Inbox is system context (isSystem=true, sortOrder=0, undeletable).
- **DayLog** – One per day per user. `closedAt` makes entries immutable.
- **DayLogEntry** – Snapshot of a task in a day. Signifiers: `dot|done|migrated_forward|migrated_backlog|cancelled`. Append-only during sync.
- **TaskTemplate / TaskTemplateItem** – Reusable task list templates.

## Critical Business Rules
1. **Task.status** = current state. **DayLogEntry** = historical snapshot.
2. **DayLogEntry** is editable while day is open, **immutable after closedAt is set**.
3. **DayLogEntry is append-only during sync** – never deleted.
4. **Two sorting systems:** Task.sortOrder (inbox/backlog), DayLogEntry.sortOrder (daily view, per context).
5. **Every task must have a context.** Default = Inbox.
6. **Inbox** is system context – cannot be deleted/archived, always first.
7. **Recurring tasks:** New instance generated ONLY after completion, server-side only.
8. **Context deletion = archivation** (soft delete, isArchived=true).
9. **Quick add rule:** context=Inbox → status=inbox. context=other → status=today, scheduledDate=today, create DayLogEntry.
10. **All ADHD features individually toggleable** via User.preferences JSON.

## UI Patterns
- **Czech language** throughout the UI (messages, labels, toasts).
- **Optimistic updates** – UI changes immediately, reverts on error.
- **Undo toasts** (5s) for destructive actions.
- **Skeleton loading** instead of spinners.
- **Responsive:** Sidebar on desktop (>1024px), bottom nav on mobile (<768px).
- **DnD** within and between context groups in daily/backlog views.
- **Signifier icons:** • (dot/open), ✕ (done), → (migrated forward), ← (migrated backlog), — (cancelled).

## Auth & Middleware
- JWT strategy, session contains `user.id`.
- `middleware.ts` protects `/(app)/*` routes.
- Login page: `/login`, Register: `/register`.
- `.env`: DATABASE_URL (SQLite), NEXTAUTH_SECRET, NEXTAUTH_URL.

## Implementation Status

### Done (Steps 1-20, 22-38, 40, 44, 46, 48)
- Full project setup, Prisma schema, auth, all API routes
- All core views: Today, Upcoming, Backlog, Archive, Contexts, Templates, Settings
- Inbox processing (Tinder-style), DnD in daily/backlog views
- BuJo lifecycle: day open/close, unclosed days review, weekly summary
- All ADHD features: progress bar, focus mode, confetti, encouraging toasts, deadline colors, task age colors
- Dark mode (next-themes), global search (Cmd+K), animations
- Responsive layout, export, subtasks, templates

### Remaining Tasks
1. **Implement recurring tasks (Step 21)** – Generate new task instance after completion using rrule. Server-side operation. Was in-progress.
2. **Add DnD to upcoming view (Step 22)** – Drag tasks between days.
3. **Add remaining keyboard shortcuts (Step 39)** – Q/N quick add, 1-6 nav, Space complete, arrow nav, etc.
4. **Add mobile swipe actions + haptic (Steps 42-43)** – Swipe right=complete, swipe left=menu, haptic feedback.
5. **Add skeleton loading states (Step 45)** – TaskItemSkeleton component exists, wire into views.
6. **Wire onboarding flow (Step 47)** – OnboardingFlow + ContextTemplateSelector components exist, connect to registration.
7. **Wire offline/Dexie into hooks (Steps 33-36)** – Dexie schema + operation queue exist, need to wire into React Query hooks as fallback.
8. **Add deadline filters (Step 41)** – TaskFilters component exists, add deadline filter options.

## Conventions
- API routes return JSON. Errors: `{ error: "message" }`.
- All hooks in `lib/hooks/` use TanStack Query and handle offline via `enqueueOperation`.
- shadcn/ui components in `components/ui/` – add new ones with `npx shadcn@latest add <component>`.
- Zustand stores in `lib/stores/`.
- Path alias: `@/` maps to project root.
