import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ROOMS_PER_HOME } from "@/lib/constants";

const schema = z.object({ name: z.string().min(1).max(40) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: homeId } = await params;

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { type: true },
  });
  if (!home) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId: session.user.id } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (home.type === "SINGLE_ROOM") {
    return NextResponse.json(
      { error: "Single-room spaces can only have one room." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const count = await prisma.room.count({ where: { homeId } });
  if (count >= MAX_ROOMS_PER_HOME) {
    return NextResponse.json(
      { error: `A home can have at most ${MAX_ROOMS_PER_HOME} rooms.` },
      { status: 400 },
    );
  }

  const room = await prisma.room.create({
    data: { name: parsed.data.name, homeId },
    select: { id: true },
  });
  return NextResponse.json({ id: room.id });
}
