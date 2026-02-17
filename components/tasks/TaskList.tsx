"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "./TaskItem";
import type { Signifier } from "@/lib/types";

interface TaskData {
  id: string;
  title: string;
  signifier?: Signifier;
  contextName?: string;
  contextIcon?: string;
  contextColor?: string;
  deadline?: string | null;
  estimatedMinutes?: number | null;
  subtaskCount?: number;
  subtaskDoneCount?: number;
  createdAt?: string;
  status?: string;
}

interface TaskListProps {
  tasks: TaskData[];
  contextId: string;
  totalTasks?: number;
  completedCount?: number;
}

function SortableTaskItem({ task, isLast }: { task: TaskData; isLast: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem {...task} isLastTask={isLast} />
    </div>
  );
}

export function TaskList({ tasks, contextId, totalTasks, completedCount }: TaskListProps) {
  const { setNodeRef } = useDroppable({ id: contextId });
  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const isLastActive = activeTasks.length === 1;

  return (
    <div ref={setNodeRef} className="min-h-[2rem]">
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTaskItem
            key={task.id}
            task={task}
            isLast={isLastActive && task.id === activeTasks[0]?.id}
          />
        ))}
      </SortableContext>
    </div>
  );
}
