import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) return notFound();

  const subtasks = await prisma.subtask.findMany({
    where: { taskId: id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(subtasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) return notFound();

  const body = await req.json();
  const { title, description } = body;

  // Auto-calculate sortOrder
  const lastSubtask = await prisma.subtask.findFirst({
    where: { taskId: id },
    orderBy: { sortOrder: "desc" },
  });

  const sortOrder = lastSubtask ? lastSubtask.sortOrder + 1 : 0;

  const subtask = await prisma.subtask.create({
    data: {
      title,
      description: description || null,
      sortOrder,
      taskId: id,
    },
  });

  return NextResponse.json(subtask, { status: 201 });
}
