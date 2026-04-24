import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Owner-only: list pending requests for a home
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: homeId } = await params;
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { ownerId: true },
  });
  if (!home) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (home.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const requests = await prisma.joinRequest.findMany({
    where: { homeId, status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ requests });
}
