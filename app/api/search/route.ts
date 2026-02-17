import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return badRequest("Search query is required");
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      title: {
        contains: q,
      },
    },
    include: {
      context: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tasks);
}
