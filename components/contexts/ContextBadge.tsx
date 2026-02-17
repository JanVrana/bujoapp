"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ContextBadgeProps {
  name: string;
  icon?: string;
  color?: string;
  className?: string;
}

export function ContextBadge({ name, icon, color, className }: ContextBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-normal gap-1 shrink-0", className)}
      style={{
        borderColor: color || undefined,
        color: color || undefined,
      }}
    >
      {icon && <span>{icon}</span>}
      {name}
    </Badge>
  );
}
