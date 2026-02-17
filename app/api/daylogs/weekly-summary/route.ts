import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  // Get all tasks completed in the last 7 days
  const completedTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: "done",
      completedAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      id: true,
      completedAt: true,
      deadline: true,
    },
  });

  const totalCompleted = completedTasks.length;

  // Calculate most productive day
  const dayCountMap: Record<string, number> = {};
  for (const task of completedTasks) {
    if (task.completedAt) {
      const dayKey = task.completedAt.toISOString().split("T")[0];
      dayCountMap[dayKey] = (dayCountMap[dayKey] || 0) + 1;
    }
  }

  let mostProductiveDay: string | null = null;
  let maxCount = 0;
  for (const [day, count] of Object.entries(dayCountMap)) {
    if (count > maxCount) {
      maxCount = count;
      mostProductiveDay = day;
    }
  }

  // Calculate deadlines met (tasks completed before or on their deadline)
  let deadlinesMet = 0;
  let deadlinesTotal = 0;
  for (const task of completedTasks) {
    if (task.deadline) {
      deadlinesTotal++;
      if (task.completedAt && task.completedAt <= task.deadline) {
        deadlinesMet++;
      }
    }
  }

  return NextResponse.json({
    totalCompleted,
    mostProductiveDay,
    mostProductiveDayCount: maxCount,
    deadlinesMet,
    deadlinesTotal,
  });
}
