import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";
import { getOrCreateTodayLog, createDayLogEntry } from "@/lib/daylog-helpers";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { migrations } = body;

  if (!migrations || !Array.isArray(migrations)) {
    return badRequest("Migrations array is required");
  }

  const todayLog = await getOrCreateTodayLog(user.id);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  for (const migration of migrations) {
    const { taskId, destination, scheduledDate } = migration;

    switch (destination) {
      case "tomorrow": {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "today",
            scheduledDate: tomorrowDate,
          },
        });

        // Update existing entry or create new one with migrated_forward signifier
        const existingEntry = await prisma.dayLogEntry.findFirst({
          where: { dayLogId: todayLog.id, taskId },
        });

        if (existingEntry) {
          await prisma.dayLogEntry.update({
            where: { id: existingEntry.id },
            data: { signifier: "migrated_forward" },
          });
        } else {
          const taskForEntry = await prisma.task.findUnique({ where: { id: taskId }, include: { context: true } });
          await createDayLogEntry({ dayLogId: todayLog.id, taskId, taskTitle: taskForEntry?.title ?? "", signifier: "migrated_forward", contextId: taskForEntry?.contextId, contextName: taskForEntry?.context?.name });
        }
        break;
      }

      case "backlog": {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "backlog",
            scheduledDate: null,
          },
        });

        await prisma.dayLogEntry.updateMany({
          where: { dayLogId: todayLog.id, taskId },
          data: { signifier: "migrated_backlog" },
        });
        break;
      }

      case "cancelled": {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: "cancelled" },
        });

        await prisma.dayLogEntry.updateMany({
          where: { dayLogId: todayLog.id, taskId },
          data: { signifier: "cancelled" },
        });
        break;
      }

      case "scheduled": {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "scheduled",
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          },
        });

        await prisma.dayLogEntry.updateMany({
          where: { dayLogId: todayLog.id, taskId },
          data: { signifier: "migrated_forward" },
        });
        break;
      }
    }
  }

  // Close today's log
  await prisma.dayLog.update({
    where: { id: todayLog.id },
    data: { closedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
