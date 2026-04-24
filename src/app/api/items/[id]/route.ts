import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ITEM_DESCRIPTION_WORDS } from "@/lib/constants";
import { wordCount } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().max(2000).optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  price: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  currency: z.string().min(3).max(4).optional().nullable(),
  quantity: z.number().int().min(1).max(999).optional(),
  optional: z.boolean().optional(),
  purchased: z.boolean().optional(),
  description: z.string().max(2000).optional().nullable(),
});

async function itemAccess(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      addedById: true,
      room: { select: { homeId: true, home: { select: { ownerId: true } } } },
    },
  });
  if (!item) return null;
  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: item.room.homeId, userId } },
  });
  if (!member) return null;
  return item;
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
  const item = await itemAccess(id, session.user.id);
  if (!item) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const desc =
    parsed.data.description === null
      ? null
      : parsed.data.description?.trim() || undefined;
  if (desc && wordCount(desc) > MAX_ITEM_DESCRIPTION_WORDS) {
    return NextResponse.json(
      { error: `Description must be ${MAX_ITEM_DESCRIPTION_WORDS} words or fewer.` },
      { status: 400 },
    );
  }

  await prisma.item.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
      ...(parsed.data.imageUrl !== undefined
        ? { imageUrl: parsed.data.imageUrl }
        : {}),
      ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
      ...(parsed.data.currency !== undefined
        ? { currency: parsed.data.currency?.toUpperCase() ?? null }
        : {}),
      ...(parsed.data.quantity !== undefined
        ? { quantity: parsed.data.quantity }
        : {}),
      ...(parsed.data.optional !== undefined
        ? { optional: parsed.data.optional }
        : {}),
      ...(parsed.data.purchased !== undefined
        ? { purchasedAt: parsed.data.purchased ? new Date() : null }
        : {}),
      ...(parsed.data.description !== undefined ? { description: desc } : {}),
    },
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
  const item = await itemAccess(id, session.user.id);
  if (!item) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Only the item's author or the home owner can delete
  if (
    item.addedById !== session.user.id &&
    item.room.home.ownerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
