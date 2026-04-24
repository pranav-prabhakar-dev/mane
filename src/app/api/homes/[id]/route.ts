import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({ name: z.string().min(1).max(60) });

async function assertMember(homeId: string, userId: string) {
  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId } },
  });
  return !!member;
}

async function assertOwner(homeId: string, userId: string) {
  const h = await prisma.home.findUnique({
    where: { id: homeId },
    select: { ownerId: true },
  });
  return !!h && h.ownerId === userId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await assertOwner(id, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await prisma.home.update({
    where: { id },
    data: { name: parsed.data.name },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const home = await prisma.home.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!home) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (home.ownerId !== session.user.id) {
    // Non-owner: leave instead of delete
    if (!(await assertMember(id, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.homeMember.delete({
      where: { homeId_userId: { homeId: id, userId: session.user.id } },
    });
    return NextResponse.json({ ok: true, left: true });
  }
  await prisma.home.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
