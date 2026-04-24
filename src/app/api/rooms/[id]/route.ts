import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().min(1).max(40) });

async function assertRoomAccess(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { homeId: true, home: { select: { type: true, ownerId: true } } },
  });
  if (!room) return null;
  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: room.homeId, userId } },
  });
  if (!member) return null;
  return room;
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
  const room = await assertRoomAccess(id, session.user.id);
  if (!room) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.room.update({
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
  const room = await assertRoomAccess(id, session.user.id);
  if (!room) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (room.home.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the home's owner can delete rooms." },
      { status: 403 },
    );
  }
  if (room.home.type === "SINGLE_ROOM") {
    return NextResponse.json(
      { error: "You can't delete the only room in a single-room space." },
      { status: 400 },
    );
  }
  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
