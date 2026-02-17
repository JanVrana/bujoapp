import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/auth-helpers";

export async function GET(
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

  const items = await prisma.taskTemplateItem.findMany({
    where: { templateId: id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(
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
  const { title, description, contextId } = body;

  if (!title) {
    return badRequest("Title is required");
  }

  // Auto-calculate sortOrder
  const lastItem = await prisma.taskTemplateItem.findFirst({
    where: { templateId: id },
    orderBy: { sortOrder: "desc" },
  });

  const sortOrder = lastItem ? lastItem.sortOrder + 1 : 0;

  const item = await prisma.taskTemplateItem.create({
    data: {
      title,
      description: description || null,
      contextId: contextId || null,
      sortOrder,
      templateId: id,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
