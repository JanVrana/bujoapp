import { prisma } from "@/lib/prisma";

export async function getOrCreateTodayLog(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dayLog = await prisma.dayLog.findUnique({
    where: { date_userId: { date: today, userId } },
  });

  if (!dayLog) {
    dayLog = await prisma.dayLog.create({
      data: { date: today, userId },
    });
  }

  return dayLog;
}

export async function createDayLogEntry({
  dayLogId,
  taskId,
  taskTitle,
  signifier = "dot",
  contextId,
  contextName,
  sortOrder,
}: {
  dayLogId: string;
  taskId: string;
  taskTitle: string;
  signifier?: string;
  contextId?: string | null;
  contextName?: string | null;
  sortOrder?: number;
}) {
  const maxOrder = sortOrder ?? (await getNextSortOrder(dayLogId, contextId ?? undefined));

  return prisma.dayLogEntry.create({
    data: {
      dayLogId,
      taskId,
      taskTitle,
      signifier,
      contextId: contextId ?? undefined,
      contextName,
      sortOrder: maxOrder,
    },
  });
}

async function getNextSortOrder(dayLogId: string, contextId?: string) {
  const lastEntry = await prisma.dayLogEntry.findFirst({
    where: { dayLogId, contextId: contextId ?? undefined },
    orderBy: { sortOrder: "desc" },
  });
  return (lastEntry?.sortOrder ?? -1) + 1;
}

export async function updateDayLogEntrySignifier(
  taskId: string,
  dayLogId: string,
  signifier: string
) {
  const dayLog = await prisma.dayLog.findUnique({ where: { id: dayLogId } });
  if (dayLog?.closedAt) return; // Immutable after close

  await prisma.dayLogEntry.updateMany({
    where: { taskId, dayLogId },
    data: { signifier, updatedAt: new Date() },
  });
}

export function getDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
