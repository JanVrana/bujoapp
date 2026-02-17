import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/auth-helpers";

export async function POST(
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
  });

  if (!daylog) return notFound();

  if (daylog.closedAt) {
    return badRequest("Cannot reorder entries of a closed day log");
  }

  const body = await req.json();
  const { items } = body;

  if (!items || !Array.isArray(items)) {
    return badRequest("Items array is required");
  }

  await prisma.$transaction(
    items.map((item: { id: string; sortOrder: number }) =>
      prisma.dayLogEntry.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
