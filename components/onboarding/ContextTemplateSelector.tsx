"use client";

import { useState } from "react";
import { useCreateContext } from "@/lib/hooks/use-contexts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTEXT_PRESETS } from "@/lib/types";

interface ContextTemplateSelectorProps {
  onComplete: () => void;
}

export function ContextTemplateSelector({ onComplete }: ContextTemplateSelectorProps) {
  const createContext = useCreateContext();
  const [creating, setCreating] = useState(false);

  const handleSelect = async (presetKey: keyof typeof CONTEXT_PRESETS) => {
    setCreating(true);
    const preset = CONTEXT_PRESETS[presetKey];
    for (const ctx of preset.contexts) {
      await createContext.mutateAsync(ctx);
    }
    setCreating(false);
    onComplete();
  };

  return (
    <div className="space-y-3">
      {Object.entries(CONTEXT_PRESETS).map(([key, preset]) => (
        <Card
          key={key}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => handleSelect(key as keyof typeof CONTEXT_PRESETS)}
        >
          <CardContent className="p-3">
            <p className="font-medium text-sm">{preset.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {preset.contexts.map((ctx) => (
                <span key={ctx.name} className="text-xs text-muted-foreground">
                  {ctx.icon} {ctx.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="ghost" className="w-full" onClick={onComplete} disabled={creating}>
        Přeskočit
      </Button>
    </div>
  );
}
