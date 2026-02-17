"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { ENCOURAGING_MESSAGES } from "@/lib/types";

export function useEncouragingToast() {
  const showEncouragement = useCallback(() => {
    const message = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
    toast.success(message, { duration: 2000 });
  }, []);

  return showEncouragement;
}
