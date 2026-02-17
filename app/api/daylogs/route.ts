import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = 30;

  const daylogs = await prisma.dayLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    skip,
    take,
    include: {
      entries: {
        include: { task: true },
      },
    },
  });

  return NextResponse.json(daylogs);
}
