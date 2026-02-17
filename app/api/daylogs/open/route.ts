import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-helpers";
import { getOrCreateTodayLog } from "@/lib/daylog-helpers";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const todayLog = await getOrCreateTodayLog(user.id);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Find unclosed previous days
  const unclosedPastLogs = await prisma.dayLog.findMany({
    where: {
      userId: user.id,
      closedAt: null,
      date: { lt: startOfToday },
    },
    include: {
      entries: {
        include: { task: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const todayLogWithEntries = await prisma.dayLog.findUnique({
    where: { id: todayLog.id },
    include: {
      entries: {
        include: { task: true },
      },
    },
  });

  return NextResponse.json({
    today: todayLogWithEntries,
    unclosedPastLogs,
  });
}
