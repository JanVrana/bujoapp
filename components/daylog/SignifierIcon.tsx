"use client";

import { cn } from "@/lib/utils";
import type { Signifier } from "@/lib/types";
import { SIGNIFIER_DISPLAY } from "@/lib/types";

interface SignifierIconProps {
  signifier: Signifier;
  className?: string;
}

export function SignifierIcon({ signifier, className }: SignifierIconProps) {
  const display = SIGNIFIER_DISPLAY[signifier] || "•";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 text-sm font-bold shrink-0",
        signifier === "done" && "text-green-600 dark:text-green-400",
        signifier === "migrated_forward" && "text-blue-600 dark:text-blue-400",
        signifier === "migrated_backlog" && "text-orange-600 dark:text-orange-400",
        signifier === "cancelled" && "text-muted-foreground",
        signifier === "dot" && "text-foreground",
        className
      )}
      title={signifier}
    >
      {display}
    </span>
  );
}
