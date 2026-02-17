"use client";

import { useState, useRef, useEffect } from "react";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface InlineAddTaskProps {
  contextId: string;
}

export function InlineAddTask({ contextId }: InlineAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    createTask.mutate(
      {
        title: title.trim(),
        contextId,
        status: "today",
        scheduledDate: today.toISOString(),
      },
      {
        onSuccess: () => {
          setTitle("");
          inputRef.current?.focus();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setTitle("");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md w-full transition-colors"
      >
        <Plus className="h-4 w-4" />
        Přidat úkol
      </button>
    );
  }

  return (
    <div className="px-3 py-1.5">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Název úkolu..."
        className="h-8 text-sm"
      />
    </div>
  );
}
