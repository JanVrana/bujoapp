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

  const item = await prisma.taskTemplateItem.findFirst({
    where: {
      id,
      template: { userId: user.id },
    },
  });

  if (!item) return notFound();

  const body = await req.json();
  const { title, description, contextId, sortOrder } = body;

  const updateData: any = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (contextId !== undefined) updateData.contextId = contextId;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const updatedItem = await prisma.taskTemplateItem.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updatedItem);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const item = await prisma.taskTemplateItem.findFirst({
    where: {
      id,
      template: { userId: user.id },
    },
  });

  if (!item) return notFound();

  await prisma.taskTemplateItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
