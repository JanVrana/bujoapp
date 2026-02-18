import { create } from "zustand";

type ActiveView = "today" | "upcoming" | "backlog" | "archive" | "settings" | "contexts" | "templates";

interface UIState {
  sidebarOpen: boolean;
  activeView: ActiveView;
  focusModeActive: boolean;
  focusModeContextFilter: string | null;
  quickAddOpen: boolean;
  searchOpen: boolean;
  taskDetailId: string | null;
  focusedTaskId: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveView: (view: ActiveView) => void;
  setFocusModeActive: (active: boolean) => void;
  setFocusModeContextFilter: (contextId: string | null) => void;
  setQuickAddOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setTaskDetailId: (id: string | null) => void;
  setFocusedTaskId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeView: "today",
  focusModeActive: false,
  focusModeContextFilter: null,
  quickAddOpen: false,
  searchOpen: false,
  taskDetailId: null,
  focusedTaskId: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),
  setFocusModeActive: (active) => set({ focusModeActive: active }),
  setFocusModeContextFilter: (contextId) => set({ focusModeContextFilter: contextId }),
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setTaskDetailId: (id) => set({ taskDetailId: id }),
  setFocusedTaskId: (id) => set({ focusedTaskId: id }),
}));
