import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/lib/utils";
import { MAX_HOMES_PER_USER } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1).max(60),
  type: z.enum(["HOME", "SINGLE_ROOM"]).default("HOME"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Count all memberships (owned or joined) toward the cap
  const count = await prisma.homeMember.count({ where: { userId } });
  if (count >= MAX_HOMES_PER_USER) {
    return NextResponse.json(
      { error: `You can only belong to ${MAX_HOMES_PER_USER} homes.` },
      { status: 400 },
    );
  }

  // Ensure unique join code
  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.home.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode();
  }

  const home = await prisma.home.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      joinCode,
      ownerId: userId,
      members: { create: { userId } },
      // SINGLE_ROOM: auto-create the single room
      ...(parsed.data.type === "SINGLE_ROOM"
        ? { rooms: { create: { name: parsed.data.name } } }
        : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: home.id });
}
