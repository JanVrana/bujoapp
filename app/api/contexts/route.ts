import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const contexts = await prisma.context.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return NextResponse.json(contexts);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { name, icon, color } = body;

  if (!name) {
    return badRequest("Name is required");
  }

  // Auto-set sortOrder to max + 1
  const maxContext = await prisma.context.findFirst({
    where: { userId: user.id },
    orderBy: { sortOrder: "desc" },
  });

  const sortOrder = maxContext ? maxContext.sortOrder + 1 : 1;

  const context = await prisma.context.create({
    data: {
      name,
      icon: icon || null,
      color: color || null,
      sortOrder,
      userId: user.id,
    },
  });

  return NextResponse.json(context, { status: 201 });
}
