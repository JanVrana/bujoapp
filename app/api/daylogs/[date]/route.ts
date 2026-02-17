import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { date } = await params;

  const parsedDate = new Date(date);
  const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate() + 1);

  const daylog = await prisma.dayLog.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      entries: {
        include: { task: true },
        orderBy: [
          { task: { contextId: "asc" } },
          { sortOrder: "asc" },
        ],
      },
    },
  });

  if (!daylog) return notFound();

  return NextResponse.json(daylog);
}
