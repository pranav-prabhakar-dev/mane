import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MAX_HOMES_PER_USER } from "@/lib/constants";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
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

  const memberships = await prisma.homeMember.findMany({
    where: { userId: user.id },
    include: {
      home: {
        select: {
          id: true,
          name: true,
          type: true,
          ownerId: true,
          _count: { select: { rooms: true, members: true } },
          requests: {
            where: { status: "PENDING" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const homes = memberships.map((m) => ({
    id: m.home.id,
    name: m.home.name,
    type: m.home.type as "HOME" | "SINGLE_ROOM",
    isOwner: m.home.ownerId === user.id,
    roomCount: m.home._count.rooms,
    memberCount: m.home._count.members,
    pendingRequests:
      m.home.ownerId === user.id ? m.home.requests.length : 0,
  }));

  return (
    <>
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="heading text-4xl font-semibold">
              {greeting(user.name ?? undefined)}
            </h1>
            <p className="mt-1 text-surface-subtle dark:text-night-subtle">
              {homes.length
                ? `${homes.length} of ${MAX_HOMES_PER_USER} spaces in your Mané.`
                : "Let's set up your first space."}
            </p>
          </div>
        </div>

        <DashboardClient
          homes={homes}
          canAddMore={homes.length < MAX_HOMES_PER_USER}
        />
      </main>
    </>
  );
}

function greeting(name?: string) {
  const first = name?.split(" ")[0];
  const hour = new Date().getHours();
  const tod =
    hour < 5
      ? "Burning the midnight oil"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  return first ? `${tod}, ${first}.` : `${tod}.`;
}
