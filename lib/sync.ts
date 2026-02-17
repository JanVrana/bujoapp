import { db } from "@/lib/db";
import { processQueue, getPendingCount } from "@/lib/operationQueue";
import { useSyncStore } from "@/lib/stores/sync-store";

export async function syncToLocal(data: {
  tasks?: unknown[];
  subtasks?: unknown[];
  contexts?: unknown[];
  dayLogs?: unknown[];
  dayLogEntries?: unknown[];
  taskTemplates?: unknown[];
  taskTemplateItems?: unknown[];
}) {
  if (data.contexts) await db.contexts.bulkPut(data.contexts as never[]);
  if (data.tasks) await db.tasks.bulkPut(data.tasks as never[]);
  if (data.subtasks) await db.subtasks.bulkPut(data.subtasks as never[]);
  if (data.dayLogs) await db.dayLogs.bulkPut(data.dayLogs as never[]);
  if (data.dayLogEntries) await db.dayLogEntries.bulkPut(data.dayLogEntries as never[]);
  if (data.taskTemplates) await db.taskTemplates.bulkPut(data.taskTemplates as never[]);
  if (data.taskTemplateItems) await db.taskTemplateItems.bulkPut(data.taskTemplateItems as never[]);
}

export async function performSync() {
  const store = useSyncStore.getState();

  if (!store.isOnline) return;

  store.setSyncing(true);

  try {
    // Push local changes
    await processQueue();

    // Pull remote changes
    const since = store.lastSyncTimestamp || 0;
    const res = await fetch(`/api/sync/pull?since=${since}`);
    if (res.ok) {
      const data = await res.json();
      await syncToLocal(data);
      store.setLastSyncTimestamp(Date.now());
    }

    store.setPendingOperationsCount(await getPendingCount());
  } catch {
    // Sync failed, will retry
  } finally {
    store.setSyncing(false);
  }
}

export function initOnlineListener() {
  if (typeof window === "undefined") return;

  const store = useSyncStore.getState();

  window.addEventListener("online", () => {
    store.setOnline(true);
    performSync();
  });

  window.addEventListener("offline", () => {
    store.setOnline(false);
  });
}
