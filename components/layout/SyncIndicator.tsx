"use client";

import { cn } from "@/lib/utils";
import { useSyncStore } from "@/lib/stores/sync-store";

interface SyncIndicatorProps {
  collapsed?: boolean;
}

export function SyncIndicator({ collapsed = false }: SyncIndicatorProps) {
  const { isOnline, isSyncing, pendingOperationsCount: pendingCount } = useSyncStore();

  const showSyncing = isSyncing || pendingCount > 0;

  let dotColor = "bg-green-500";
  let label = "Synced";

  if (!isOnline) {
    dotColor = "bg-red-500";
    label = "Offline";
  } else if (showSyncing) {
    dotColor = "bg-yellow-500";
    label = `Syncing${pendingCount > 0 ? ` (${pendingCount})` : ""}`;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        collapsed && "justify-center"
      )}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {showSyncing && isOnline && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              dotColor
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            dotColor
          )}
        />
      </span>
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
