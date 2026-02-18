"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Skeleton className="h-4 w-4 rounded-full shrink-0" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function TaskContextGroupSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2 py-1">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      <div className="space-y-1">
        <TaskItemSkeleton />
        <TaskItemSkeleton />
        <TaskItemSkeleton />
      </div>
    </div>
  );
}

export function TaskListSkeleton({ groups = 3 }: { groups?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: groups }).map((_, i) => (
        <TaskContextGroupSkeleton key={i} />
      ))}
    </div>
  );
}
