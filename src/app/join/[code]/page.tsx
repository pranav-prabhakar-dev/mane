import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/AuthShell";
import { JoinRequestButton } from "./JoinRequestButton";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const joinCode = decodeURIComponent(code).toUpperCase();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/join/${joinCode}`)}`);
  }

  const home = await prisma.home.findFirst({
    where: { joinCode: { equals: joinCode, mode: "insensitive" } },
    select: { id: true, name: true, type: true, ownerId: true },
  });

  if (!home) {
    return (
      <AuthShell title="We couldn't find that home" subtitle="The code may be mistyped or the space may have been deleted.">
        <Link href="/dashboard" className="btn-primary w-full justify-center">
          Back to your spaces
        </Link>
      </AuthShell>
    );
  }

  if (home.ownerId === session.user.id) {
    redirect(`/home/${home.id}`);
  }

  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: home.id, userId: session.user.id } },
  });
  if (member) redirect(`/home/${home.id}`);

  const existing = await prisma.joinRequest.findUnique({
    where: { homeId_userId: { homeId: home.id, userId: session.user.id } },
  });

  return (
    <AuthShell
      title={`Join ${home.name}?`}
      subtitle={
        existing?.status === "PENDING"
          ? "Your request is waiting for the owner to approve it."
          : "Send a request to join. The owner will approve it."
      }
    >
      <JoinRequestButton
        joinCode={joinCode}
        homeId={home.id}
        alreadyPending={existing?.status === "PENDING"}
      />
    </AuthShell>
  );
}
