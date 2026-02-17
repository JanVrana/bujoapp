import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound } from "@/lib/auth-helpers";
import { getOrCreateTodayLog, createDayLogEntry } from "@/lib/daylog-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const template = await prisma.taskTemplate.findFirst({
    where: { id, userId: user.id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!template) return notFound();

  const todayLog = await getOrCreateTodayLog(user.id);
  const today = new Date();
  const createdTasks = [];

  for (const item of template.items) {
    let contextId = item.contextId;

    // If context is archived, restore it
    if (contextId) {
      const context = await prisma.context.findUnique({
        where: { id: contextId },
      });

      if (context && context.isArchived) {
        await prisma.context.update({
          where: { id: contextId },
          data: { isArchived: false },
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: item.title,
        description: item.description,
        contextId: contextId,
        status: "today",
        scheduledDate: today,
        userId: user.id,
      },
      include: {
        context: true,
      },
    });

    await createDayLogEntry({ dayLogId: todayLog.id, taskId: task.id, taskTitle: task.title, contextId: task.contextId, contextName: task.context?.name });
    createdTasks.push(task);
  }

  return NextResponse.json(createdTasks, { status: 201 });
}
