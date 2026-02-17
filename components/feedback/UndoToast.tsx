"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export function useUndoToast() {
  const showUndo = useCallback(
    (message: string, onUndo: () => void) => {
      toast(message, {
        duration: 5000,
        action: {
          label: "Zpět",
          onClick: onUndo,
        },
      });
    },
    []
  );

  return showUndo;
}
