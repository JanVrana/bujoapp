import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperationsCount: number;
  lastSyncTimestamp: number | null;

  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingOperationsCount: (count: number) => void;
  setLastSyncTimestamp: (timestamp: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof window !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingOperationsCount: 0,
  lastSyncTimestamp: null,

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setPendingOperationsCount: (count) => set({ pendingOperationsCount: count }),
  setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
}));
