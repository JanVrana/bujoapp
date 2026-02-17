import { db, type PendingOperation } from "@/lib/db";

export async function enqueueOperation(op: Omit<PendingOperation, "id" | "status" | "timestamp">) {
  return db.pendingOperations.add({
    ...op,
    status: "pending",
    timestamp: Date.now(),
  });
}

export async function processQueue() {
  const pending = await db.pendingOperations
    .where("status")
    .equals("pending")
    .sortBy("timestamp");

  for (const op of pending) {
    try {
      const res = await fetch(op.endpoint, {
        method: op.method,
        headers: op.body ? { "Content-Type": "application/json" } : undefined,
        body: op.body,
      });

      if (res.ok) {
        await db.pendingOperations.update(op.id!, { status: "synced" });
      } else {
        await db.pendingOperations.update(op.id!, { status: "failed" });
      }
    } catch {
      // Network error - keep as pending
      break;
    }
  }

  // Clean up synced operations older than 1 hour
  const cutoff = Date.now() - 60 * 60 * 1000;
  await db.pendingOperations
    .where("status")
    .equals("synced")
    .filter((op) => op.timestamp < cutoff)
    .delete();
}

export async function getPendingCount() {
  return db.pendingOperations.where("status").equals("pending").count();
}
