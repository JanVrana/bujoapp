import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";
import { getOrCreateTodayLog, createDayLogEntry } from "@/lib/daylog-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const contextId = searchParams.get("contextId");
  const scheduledDate = searchParams.get("scheduledDate");

  const where: any = { userId: user.id };

  if (status) {
    where.status = status;
  }

  if (contextId) {
    where.contextId = contextId;
  }

  if (scheduledDate) {
    const date = new Date(scheduledDate);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    where.scheduledDate = {
      gte: startOfDay,
      lt: endOfDay,
    };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      subtasks: true,
      context: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { title, description, contextId, deadline, estimatedMinutes, scheduledDate, status } = body;

  if (!title) {
    return badRequest("Title is required");
  }

  // Look up Inbox context
  const inboxContext = await prisma.context.findFirst({
    where: { userId: user.id, isSystem: true, name: "Inbox" },
  });

  // Determine default contextId and status
  const resolvedContextId = contextId || inboxContext?.id;
  if (!resolvedContextId) {
    return badRequest("No context specified and no Inbox context found");
  }

  let taskStatus = status;
  if (!taskStatus) {
    taskStatus = resolvedContextId === inboxContext?.id ? "inbox" : "today";
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      contextId: resolvedContextId,
      deadline: deadline ? new Date(deadline) : null,
      estimatedMinutes: estimatedMinutes || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : taskStatus === "today" ? new Date() : null,
      status: taskStatus,
      userId: user.id,
    },
    include: {
      subtasks: true,
      context: true,
    },
  });

  if (taskStatus === "today") {
    const dayLog = await getOrCreateTodayLog(user.id);
    await createDayLogEntry({ dayLogId: dayLog.id, taskId: task.id, taskTitle: task.title, contextId: task.contextId, contextName: task.context?.name });
  }

  return NextResponse.json(task, { status: 201 });
}
