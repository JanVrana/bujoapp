import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { items } = body;

  if (!items || !Array.isArray(items)) {
    return badRequest("Items array is required");
  }

  // Ensure Inbox always has sortOrder 0
  const inboxContext = await prisma.context.findFirst({
    where: { userId: user.id, isSystem: true, name: "Inbox" },
  });

  const updates = items.map((item: { id: string; sortOrder: number }) => {
    const sortOrder = inboxContext && item.id === inboxContext.id ? 0 : item.sortOrder;
    return prisma.context.update({
      where: { id: item.id },
      data: { sortOrder },
    });
  });

  await prisma.$transaction(updates);

  return NextResponse.json({ success: true });
}
