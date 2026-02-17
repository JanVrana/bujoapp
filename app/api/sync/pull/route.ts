import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  if (!since) {
    return badRequest("'since' timestamp parameter is required");
  }

  const sinceDate = new Date(parseInt(since, 10));

  const [tasks, subtasks, contexts, templates, templateItems, daylogs, daylogEntries] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          updatedAt: { gte: sinceDate },
        },
        include: { subtasks: true, context: true },
      }),
      prisma.subtask.findMany({
        where: {
          task: { userId: user.id },
          updatedAt: { gte: sinceDate },
        },
      }),
      prisma.context.findMany({
        where: {
          userId: user.id,
          updatedAt: { gte: sinceDate },
        },
      }),
      prisma.taskTemplate.findMany({
        where: {
          userId: user.id,
          updatedAt: { gte: sinceDate },
        },
      }),
      prisma.taskTemplateItem.findMany({
        where: {
          template: { userId: user.id },
        },
      }),
      prisma.dayLog.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: sinceDate },
        },
      }),
      prisma.dayLogEntry.findMany({
        where: {
          dayLog: { userId: user.id },
          updatedAt: { gte: sinceDate },
        },
      }),
    ]);

  return NextResponse.json({
    timestamp: Date.now(),
    tasks,
    subtasks,
    contexts,
    templates,
    templateItems,
    daylogs,
    daylogEntries,
  });
}
