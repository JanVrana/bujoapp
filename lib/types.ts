import type { Task, Subtask, Context, DayLog, DayLogEntry, TaskTemplate, TaskTemplateItem } from "@prisma/client";

// Re-export Prisma types
export type { Task, Subtask, Context, DayLog, DayLogEntry, TaskTemplate, TaskTemplateItem };

// Task status enum
export type TaskStatus = "inbox" | "today" | "scheduled" | "backlog" | "done" | "cancelled";

// Signifier enum
export type Signifier = "dot" | "done" | "migrated_forward" | "migrated_backlog" | "cancelled";

// Signifier display mapping
export const SIGNIFIER_DISPLAY: Record<Signifier, string> = {
  dot: "•",
  done: "✕",
  migrated_forward: "→",
  migrated_backlog: "←",
  cancelled: "—",
};

// Composite types
export type TaskWithSubtasks = Task & {
  subtasks: Subtask[];
  context: Context;
};

export type DayLogWithEntries = DayLog & {
  entries: (DayLogEntry & {
    task: Task | null;
  })[];
};

export type ContextWithTaskCount = Context & {
  _count: { tasks: number };
};

// User preferences
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  confettiEnabled: boolean;
  encouragingMessagesEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  taskAgeColorEnabled: boolean;
  progressBarEnabled: boolean;
  onboardingCompleted: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  confettiEnabled: true,
  encouragingMessagesEnabled: true,
  hapticFeedbackEnabled: true,
  taskAgeColorEnabled: true,
  progressBarEnabled: true,
  onboardingCompleted: false,
};

// API request/response types
export interface CreateTaskInput {
  title: string;
  description?: string;
  contextId: string;
  deadline?: string;
  estimatedMinutes?: number;
  scheduledDate?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  contextId?: string;
  deadline?: string | null;
  estimatedMinutes?: number | null;
  scheduledDate?: string | null;
  status?: TaskStatus;
  sortOrder?: number;
  isRecurring?: boolean;
  recurringRule?: string | null;
}

export interface ReorderInput {
  items: { id: string; sortOrder: number }[];
}

export interface ProcessInboxTaskInput {
  contextId: string;
  destination: "today" | "scheduled" | "backlog";
  scheduledDate?: string;
}

export interface MigrateTaskInput {
  taskId: string;
  destination: "tomorrow" | "backlog" | "cancelled" | "scheduled";
  scheduledDate?: string;
}

export interface DayCloseInput {
  migrations: MigrateTaskInput[];
}

// Encouraging messages (Czech)
export const ENCOURAGING_MESSAGES = [
  "Skvělá práce! 💪",
  "Jedeš! 🚀",
  "Další hotovo! ✨",
  "Super! Jen tak dál! 🌟",
  "Výborně! 👏",
  "To jde! 🎯",
  "Bomba! 💥",
  "Pecka! 🍑",
  "Máš to! 🏆",
  "Tak takhle se to dělá! 🔥",
];

// Time estimate quick options
export const TIME_ESTIMATE_OPTIONS = [5, 15, 30, 60] as const;

// Context template presets for onboarding
export const CONTEXT_PRESETS = {
  gtd: {
    name: "GTD klasika",
    contexts: [
      { name: "@počítač", icon: "💻", color: "#3B82F6" },
      { name: "@telefon", icon: "📱", color: "#10B981" },
      { name: "@venku", icon: "🌳", color: "#F59E0B" },
      { name: "@obchod", icon: "🛒", color: "#EF4444" },
    ],
  },
  life: {
    name: "Oblasti života",
    contexts: [
      { name: "@práce", icon: "💼", color: "#3B82F6" },
      { name: "@doma", icon: "🏠", color: "#10B981" },
      { name: "@rodina", icon: "👨‍👩‍👧‍👦", color: "#F59E0B" },
      { name: "@zdraví", icon: "🏃", color: "#EF4444" },
    ],
  },
};
