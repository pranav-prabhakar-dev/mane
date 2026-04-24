import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: homeId, userId: targetUserId } = await params;

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { ownerId: true },
  });
  if (!home) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = home.ownerId === session.user.id;
  const isSelf = targetUserId === session.user.id;

  // Only the owner can remove others. Anyone can remove themselves.
  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Owner can't be removed through this route — they must delete the home.
  if (targetUserId === home.ownerId) {
    return NextResponse.json(
      { error: "The owner can't be removed. Delete the home instead." },
      { status: 400 },
    );
  }

  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId: targetUserId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 404 });
  }

  await prisma.homeMember.delete({
    where: { homeId_userId: { homeId, userId: targetUserId } },
  });

  return NextResponse.json({ ok: true, self: isSelf });
}
