import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const context = await prisma.context.findFirst({
    where: { id, userId: user.id },
  });

  if (!context) return notFound();

  const body = await req.json();
  const { name, icon, color } = body;

  if (context.isSystem && name !== undefined && name !== context.name) {
    return badRequest("Cannot edit the name of a system context");
  }

  const updateData: any = {};

  if (name !== undefined) updateData.name = name;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;

  const updatedContext = await prisma.context.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updatedContext);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const context = await prisma.context.findFirst({
    where: { id, userId: user.id },
  });

  if (!context) return notFound();

  if (context.isSystem) {
    return badRequest("Cannot delete a system context");
  }

  // Soft delete
  await prisma.context.update({
    where: { id },
    data: { isArchived: true },
  });

  return NextResponse.json({ success: true });
}
