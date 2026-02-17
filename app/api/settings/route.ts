import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferences: true },
  });

  const preferences = dbUser?.preferences ? JSON.parse(dbUser.preferences as string) : {};

  return NextResponse.json(preferences);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferences: true },
  });

  const existingPreferences = dbUser?.preferences ? JSON.parse(dbUser.preferences as string) : {};
  const mergedPreferences = { ...existingPreferences, ...body };

  await prisma.user.update({
    where: { id: user.id },
    data: { preferences: JSON.stringify(mergedPreferences) },
  });

  return NextResponse.json(mergedPreferences);
}
