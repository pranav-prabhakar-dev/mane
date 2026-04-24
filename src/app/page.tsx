import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="heading text-2xl font-medium text-brand-600 dark:text-brand-400">
          Mané
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Create account
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 pt-10 text-center">
        <span className="pill">plan your home, together</span>
        <h1 className="heading text-5xl font-semibold tracking-tight sm:text-6xl" style={{ lineHeight: 1.25 }}>
          <span className="block">A warm place to plan</span>
          <span className="block">what you&rsquo;ll buy for home.</span>
        </h1>
        <p className="max-w-2xl text-lg text-surface-subtle dark:text-night-subtle">
          Mané helps you and the people you live with sketch out every room —
          paste a product link, we'll fetch the price and photo, and watch your
          list (and total) come together, room by room.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Get started — it's free
          </Link>
          <Link href="/login" className="btn-outline px-6 py-3 text-base">
            I already have an account
          </Link>
        </div>
      </section>

      <footer className="px-8 pb-6 text-center text-sm text-surface-muted dark:text-night-muted">
        Made with warmth. Mané.
      </footer>
    </main>
  );
}
