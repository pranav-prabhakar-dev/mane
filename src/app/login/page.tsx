import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user?.id) redirect(callbackUrl || "/dashboard");

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep planning your space."
      footer={
        <>
          New to Mané?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton callbackUrl={callbackUrl || "/dashboard"} />
        <Divider />
        <LoginForm />
      </div>
    </AuthShell>
  );
}

function Divider() {
  return (
    <div className="relative my-2 flex items-center gap-3 text-xs uppercase tracking-wider text-surface-muted dark:text-night-muted">
      <span className="h-px flex-1 bg-surface-border dark:bg-night-border" />
      or
      <span className="h-px flex-1 bg-surface-border dark:bg-night-border" />
    </div>
  );
}
