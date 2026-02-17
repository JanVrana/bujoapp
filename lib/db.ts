import Dexie, { type Table } from "dexie";

export interface LocalTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: string | null;
  deadline?: string | null;
  estimatedMinutes?: number | null;
  sortOrder: number;
  isRecurring: boolean;
  recurringRule?: string | null;
  completedAt?: string | null;
  contextId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSubtask {
  id: string;
  title: string;
  description?: string | null;
  isDone: boolean;
  sortOrder: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalContext {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isArchived: boolean;
  isSystem: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDayLog {
  id: string;
  date: string;
  closedAt?: string | null;
  userId: string;
  createdAt: string;
}

export interface LocalDayLogEntry {
  id: string;
  signifier: string;
  sortOrder: number;
  taskTitle: string;
  contextName?: string | null;
  dayLogId: string;
  taskId?: string | null;
  contextId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalTaskTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalTaskTemplateItem {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  contextId: string;
  templateId: string;
}

export interface PendingOperation {
  id?: number;
  type: string;
  endpoint: string;
  method: string;
  body?: string;
  timestamp: number;
  status: "pending" | "synced" | "failed";
}

class BujoDatabase extends Dexie {
  tasks!: Table<LocalTask, string>;
  subtasks!: Table<LocalSubtask, string>;
  contexts!: Table<LocalContext, string>;
  dayLogs!: Table<LocalDayLog, string>;
  dayLogEntries!: Table<LocalDayLogEntry, string>;
  taskTemplates!: Table<LocalTaskTemplate, string>;
  taskTemplateItems!: Table<LocalTaskTemplateItem, string>;
  pendingOperations!: Table<PendingOperation, number>;

  constructor() {
    super("BujoGTD");
    this.version(1).stores({
      tasks: "id, userId, status, contextId, scheduledDate, [userId+status], [userId+scheduledDate]",
      subtasks: "id, taskId",
      contexts: "id, userId, [userId+isArchived]",
      dayLogs: "id, userId, date, [date+userId]",
      dayLogEntries: "id, dayLogId, taskId, [dayLogId+contextId]",
      taskTemplates: "id, userId",
      taskTemplateItems: "id, templateId",
      pendingOperations: "++id, status, timestamp",
    });
  }
}

export const db = new BujoDatabase();
