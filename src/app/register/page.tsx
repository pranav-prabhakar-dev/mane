import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <AuthShell
      title="Create your Mané"
      subtitle="Pick your currency, then invite the people you live with."
      footer={
        <>
          Already with us?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton callbackUrl="/onboarding" />
        <div className="relative my-2 flex items-center gap-3 text-xs uppercase tracking-wider text-surface-muted dark:text-night-muted">
          <span className="h-px flex-1 bg-surface-border dark:bg-night-border" />
          or
          <span className="h-px flex-1 bg-surface-border dark:bg-night-border" />
        </div>
        <RegisterForm />
      </div>
    </AuthShell>
  );
}
