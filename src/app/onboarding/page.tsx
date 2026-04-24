import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/AuthShell";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, currency: true, onboardedAt: true },
  });
  if (!user) redirect("/login");
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <AuthShell
      title={`Hi${user.name ? `, ${user.name.split(" ")[0]}` : ""} — one last thing`}
      subtitle="Pick your default currency. You can change it any time from your profile."
    >
      <OnboardingForm initialCurrency={user.currency} initialName={user.name ?? ""} />
    </AuthShell>
  );
}
