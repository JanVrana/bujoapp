import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const templates = await prisma.taskTemplate.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { name, icon, color } = body;

  if (!name) {
    return badRequest("Name is required");
  }

  const template = await prisma.taskTemplate.create({
    data: {
      name,
      icon: icon || null,
      color: color || null,
      userId: user.id,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
