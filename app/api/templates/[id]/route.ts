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

  const template = await prisma.taskTemplate.findFirst({
    where: { id, userId: user.id },
  });

  if (!template) return notFound();

  const body = await req.json();
  const { name, icon, color } = body;

  const updateData: any = {};

  if (name !== undefined) updateData.name = name;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;

  const updatedTemplate = await prisma.taskTemplate.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updatedTemplate);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const template = await prisma.taskTemplate.findFirst({
    where: { id, userId: user.id },
  });

  if (!template) return notFound();

  await prisma.taskTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
