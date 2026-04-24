import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/DashboardHeader";
import { HomeClient } from "./HomeClient";

export default async function HomePage({
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

  const home = await prisma.home.findUnique({
    where: { id },
    include: {
      rooms: {
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            select: {
              price: true,
              quantity: true,
              optional: true,
              purchasedAt: true,
            },
          },
        },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      requests: {
        where: { status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!home) notFound();

  const isMember = home.members.some((m) => m.userId === user.id);
  if (!isMember) redirect("/dashboard");
  const isOwner = home.ownerId === user.id;

  const rooms = home.rooms.map((r) => {
    let subtotal = 0;
    let subtotalWithOptional = 0;
    let purchasedTotal = 0;
    let toBuyCount = 0;
    for (const it of r.items) {
      const line = (it.price ?? 0) * (it.quantity ?? 1);
      if (it.purchasedAt) {
        purchasedTotal += line;
      } else {
        toBuyCount += 1;
        subtotalWithOptional += line;
        if (!it.optional) subtotal += line;
      }
    }
    return {
      id: r.id,
      name: r.name,
      itemCount: r.items.length,
      toBuyCount,
      subtotal,
      subtotalWithOptional,
      purchasedTotal,
    };
  });

  return (
    <>
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-surface-subtle hover:text-surface-text dark:text-night-subtle dark:hover:text-night-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to all spaces
        </Link>

        <HomeClient
          home={{
            id: home.id,
            name: home.name,
            type: home.type,
            joinCode: home.joinCode,
            isOwner,
            ownerId: home.ownerId,
          }}
          rooms={rooms}
          members={home.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
            isOwner: m.user.id === home.ownerId,
          }))}
          requests={home.requests.map((r) => ({
            id: r.id,
            user: {
              id: r.user.id,
              name: r.user.name,
              email: r.user.email,
              image: r.user.image,
            },
          }))}
          currency={user.currency}
          currentUserId={user.id}
        />
      </main>
    </>
  );
}
