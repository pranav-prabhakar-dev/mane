import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RoomClient } from "./RoomClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      onboardedAt: true,
    },
  });
  if (!user) redirect("/login");
  if (!user.onboardedAt) redirect("/onboarding");

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      home: {
        select: { id: true, name: true, ownerId: true },
      },
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          addedBy: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });
  if (!room) notFound();

  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: room.homeId, userId: user.id } },
  });
  if (!member) redirect("/dashboard");

  return (
    <>
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-6 pb-16 sm:px-10">
        <Link
          href={`/home/${room.homeId}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-surface-subtle hover:text-surface-text dark:text-night-subtle dark:hover:text-night-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {room.home.name}
        </Link>

        <RoomClient
          room={{ id: room.id, name: room.name, homeId: room.homeId }}
          home={{
            id: room.home.id,
            name: room.home.name,
            ownerId: room.home.ownerId,
          }}
          initialItems={room.items.map((it) => ({
            id: it.id,
            name: it.name,
            url: it.url,
            imageUrl: it.imageUrl,
            price: it.price,
            currency: it.currency,
            quantity: it.quantity,
            optional: it.optional,
            purchasedAt: it.purchasedAt ? it.purchasedAt.toISOString() : null,
            description: it.description,
            createdAt: it.createdAt.toISOString(),
            addedBy: {
              id: it.addedBy.id,
              name: it.addedBy.name,
              email: it.addedBy.email,
              image: it.addedBy.image,
            },
          }))}
          currency={user.currency}
          currentUserId={user.id}
        />
      </main>
    </>
  );
}
