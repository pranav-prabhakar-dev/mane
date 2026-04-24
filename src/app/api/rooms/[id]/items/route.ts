import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ITEM_DESCRIPTION_WORDS } from "@/lib/constants";
import { wordCount } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().max(2000).optional().or(z.literal("").transform(() => undefined)),
  imageUrl: z
    .string()
    .url()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  price: z
    .number()
    .nonnegative()
    .max(1_000_000_000)
    .optional()
    .nullable(),
  currency: z.string().min(3).max(4).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
  optional: z.boolean().optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { homeId: true },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: room.homeId, userId: session.user.id } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const desc = parsed.data.description?.trim() || undefined;
  if (desc && wordCount(desc) > MAX_ITEM_DESCRIPTION_WORDS) {
    return NextResponse.json(
      { error: `Description must be ${MAX_ITEM_DESCRIPTION_WORDS} words or fewer.` },
      { status: 400 },
    );
  }

  const item = await prisma.item.create({
    data: {
      roomId,
      name: parsed.data.name.trim(),
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl,
      price: parsed.data.price ?? null,
      currency: parsed.data.currency?.toUpperCase(),
      quantity: parsed.data.quantity ?? 1,
      optional: parsed.data.optional ?? false,
      description: desc,
      addedById: session.user.id,
    },
    include: {
      addedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  return NextResponse.json({ item });
}
