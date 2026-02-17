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

  await prisma.$transaction(
    items.map((item: { id: string; sortOrder: number }) =>
      prisma.task.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
