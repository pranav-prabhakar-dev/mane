import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_HOMES_PER_USER } from "@/lib/constants";

const schema = z.object({
  joinCode: z.string().min(3).max(80),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const joinCode = parsed.data.joinCode.trim().toUpperCase();
  const home = await prisma.home.findFirst({
    where: { joinCode: { equals: joinCode, mode: "insensitive" } },
    select: { id: true, name: true, ownerId: true },
  });
  if (!home) {
    return NextResponse.json(
      { error: "No home matches that code." },
      { status: 404 },
    );
  }

  if (home.ownerId === userId) {
    return NextResponse.json(
      { error: "You own this home already." },
      { status: 400 },
    );
  }

  const existingMember = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: home.id, userId } },
  });
  if (existingMember) {
    return NextResponse.json(
      { error: "You are already a member of this home.", homeId: home.id },
      { status: 400 },
    );
  }

  const memberships = await prisma.homeMember.count({ where: { userId } });
  if (memberships >= MAX_HOMES_PER_USER) {
    return NextResponse.json(
      { error: `You can only belong to ${MAX_HOMES_PER_USER} homes.` },
      { status: 400 },
    );
  }

  const existingReq = await prisma.joinRequest.findUnique({
    where: { homeId_userId: { homeId: home.id, userId } },
  });
  if (existingReq && existingReq.status === "PENDING") {
    return NextResponse.json({
      ok: true,
      pending: true,
      homeName: home.name,
    });
  }

  await prisma.joinRequest.upsert({
    where: { homeId_userId: { homeId: home.id, userId } },
    create: { homeId: home.id, userId, status: "PENDING" },
    update: { status: "PENDING" },
  });

  return NextResponse.json({ ok: true, pending: true, homeName: home.name });
}
