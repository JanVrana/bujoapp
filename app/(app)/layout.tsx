"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDetail } from "@/components/tasks/TaskDetail";

const viewRoutes: Record<string, string> = {
  "1": "/today",
  "2": "/upcoming",
  "3": "/backlog",
  "4": "/archive",
  "5": "/templates",
  "6": "/settings",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    sidebarOpen,
    taskDetailId,
    setTaskDetailId,
    quickAddOpen,
    setQuickAddOpen,
    searchOpen,
    setSearchOpen,
    focusedTaskId,
    setFocusedTaskId,
  } = useUIStore();
  const router = useRouter();
  const updateTask = useUpdateTask();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((settings) => {
        if (!settings.onboardingCompleted) {
          router.push("/onboarding");
        } else {
          setOnboardingChecked(true);
        }
      })
      .catch(() => {
        // If settings fetch fails, allow access anyway
        setOnboardingChecked(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Ctrl+K / Cmd+K for search (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
        return;
      }

      // Escape to close dialogs
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
        if (quickAddOpen) {
          setQuickAddOpen(false);
          return;
        }
        if (taskDetailId) {
          setTaskDetailId(null);
          return;
        }
        return;
      }

      // Don't process remaining shortcuts when in an input
      if (isInput) return;

      // Space: complete focused task
      if (e.code === "Space" && focusedTaskId) {
        e.preventDefault();
        updateTask.mutate({ id: focusedTaskId, status: "done" });
        return;
      }

      // Enter: open task detail for focused task
      if (e.key === "Enter" && focusedTaskId) {
        e.preventDefault();
        setTaskDetailId(focusedTaskId);
        return;
      }

      // Arrow keys: move focus between tasks
      if (e.key === "ArrowUp") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("focus-task-prev"));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("focus-task-next"));
        return;
      }

      // Digit 1-6: navigate to views
      const route = viewRoutes[e.key];
      if (route) {
        e.preventDefault();
        router.push(route);
        return;
      }

      // Q or N to open Quick Add
      if (e.key === "q" || e.key === "n") {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }
    },
    [
      searchOpen,
      quickAddOpen,
      taskDetailId,
      setSearchOpen,
      setQuickAddOpen,
      setTaskDetailId,
      focusedTaskId,
      setFocusedTaskId,
      updateTask,
      router,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  {/* UnclosedDaysReview will be added in Phase 3 */}

  if (!onboardingChecked) {
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto pb-16 md:pb-0 transition-all duration-200",
          !sidebarOpen ? "md:pl-16" : "md:pl-64"
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav className="md:hidden" />

      {/* Global Dialogs */}
      <QuickAdd />
      <SearchDialog />

      {/* Task Detail Sheet */}
      {taskDetailId && <TaskDetail taskId={taskDetailId} />}
    </div>
  );
}
