import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_HOMES_PER_USER } from "@/lib/constants";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT"]) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: homeId, requestId } = await params;

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { ownerId: true },
  });
  if (!home) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (home.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const joinReq = await prisma.joinRequest.findUnique({
    where: { id: requestId },
  });
  if (!joinReq || joinReq.homeId !== homeId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (joinReq.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request already resolved." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "REJECT") {
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ ok: true });
  }

  // Approve: ensure requester can still accept (cap check)
  const currentMemberships = await prisma.homeMember.count({
    where: { userId: joinReq.userId },
  });
  if (currentMemberships >= MAX_HOMES_PER_USER) {
    return NextResponse.json(
      {
        error:
          "This user has reached their maximum number of homes. They must leave one before being approved.",
      },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.homeMember.upsert({
      where: {
        homeId_userId: { homeId, userId: joinReq.userId },
      },
      create: { homeId, userId: joinReq.userId },
      update: {},
    }),
    prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
