"use client";

import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    sidebarOpen,
    taskDetailId,
    setTaskDetailId,
    quickAddOpen,
    setQuickAddOpen,
    searchOpen,
    setSearchOpen,
  } = useUIStore();

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
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  {/* UnclosedDaysReview will be added in Phase 3 */}

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
