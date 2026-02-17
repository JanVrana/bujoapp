"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface SubtaskData {
  id: string;
  title: string;
  description?: string | null;
  isDone: boolean;
  sortOrder: number;
}

export function SubtaskList({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  const { data: subtasks = [] } = useQuery<SubtaskData[]>({
    queryKey: ["subtasks", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createSubtask = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] }),
  });

  const updateSubtask = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; isDone?: boolean; title?: string }) => {
      const res = await fetch(`/api/subtasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] }),
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] }),
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createSubtask.mutate(newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="space-y-2 mt-2">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 group">
          <Checkbox
            checked={subtask.isDone}
            onCheckedChange={(checked) =>
              updateSubtask.mutate({ id: subtask.id, isDone: !!checked })
            }
          />
          <span className={subtask.isDone ? "line-through text-muted-foreground flex-1" : "flex-1"}>
            {subtask.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => deleteSubtask.mutate(subtask.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Přidat podúkol..."
          className="h-7 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
