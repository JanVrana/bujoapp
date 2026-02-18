import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound } from "@/lib/auth-helpers";
import { getOrCreateTodayLog, createDayLogEntry } from "@/lib/daylog-helpers";
import { RRule } from "rrule";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) return notFound();

  const body = await req.json();
  const { title, description, contextId, deadline, estimatedMinutes, scheduledDate, status, sortOrder, isRecurring, recurringRule } = body;

  const updateData: any = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (contextId !== undefined) updateData.contextId = contextId;
  if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
  if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
  if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
  if (recurringRule !== undefined) updateData.recurringRule = recurringRule;

  if (status !== undefined) {
    updateData.status = status;

    if (status === "done" && task.status !== "done") {
      updateData.completedAt = new Date();

      // Update DayLogEntry signifier to done
      const todayLog = await getOrCreateTodayLog(user.id);
      await prisma.dayLogEntry.updateMany({
        where: { dayLogId: todayLog.id, taskId: id },
        data: { signifier: "done" },
      });

      // Generate next occurrence for recurring tasks
      if (task.isRecurring && task.recurringRule) {
        try {
          const rrule = RRule.fromString(`DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\nRRULE:${task.recurringRule}`);
          const nextDates = rrule.after(new Date());
          const nextDate = nextDates ?? new Date();

          await prisma.task.create({
            data: {
              title: task.title,
              description: task.description,
              contextId: task.contextId,
              estimatedMinutes: task.estimatedMinutes,
              isRecurring: true,
              recurringRule: task.recurringRule,
              status: "scheduled",
              scheduledDate: nextDate,
              userId: user.id,
            },
          });
        } catch (e) {
          console.error("Failed to generate next recurring task:", e);
        }
      }
    }

    if (status === "today" && task.status !== "today") {
      updateData.scheduledDate = new Date();

      const dayLog = await getOrCreateTodayLog(user.id);
      const existingEntry = await prisma.dayLogEntry.findFirst({
        where: { dayLogId: dayLog.id, taskId: id },
      });

      if (!existingEntry) {
        await createDayLogEntry({ dayLogId: dayLog.id, taskId: id, taskTitle: task.title, contextId: task.contextId });
      }
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      subtasks: true,
      context: true,
    },
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) return notFound();

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
