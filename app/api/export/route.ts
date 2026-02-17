import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const [tasks, subtasks, contexts, templates, daylogs, daylogEntries] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subtask.findMany({
      where: { task: { userId: user.id } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.context.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.taskTemplate.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dayLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    }),
    prisma.dayLogEntry.findMany({
      where: { dayLog: { userId: user.id } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    tasks,
    subtasks,
    contexts,
    templates,
    daylogs,
    daylogEntries,
  };

  return NextResponse.json(exportData);
}
