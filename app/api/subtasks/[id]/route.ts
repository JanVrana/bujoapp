import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const subtask = await prisma.subtask.findFirst({
    where: {
      id,
      task: { userId: user.id },
    },
  });

  if (!subtask) return notFound();

  const body = await req.json();
  const { title, description, isDone, sortOrder } = body;

  const updateData: any = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (isDone !== undefined) updateData.isDone = isDone;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const updatedSubtask = await prisma.subtask.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updatedSubtask);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const subtask = await prisma.subtask.findFirst({
    where: {
      id,
      task: { userId: user.id },
    },
  });

  if (!subtask) return notFound();

  await prisma.subtask.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
