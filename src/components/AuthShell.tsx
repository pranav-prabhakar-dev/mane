import Link from "next/link";
import { type ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <Link
          href="/"
          className="heading text-2xl font-medium text-brand-600 dark:text-brand-400"
        >
          Mané
        </Link>
        <ThemeToggle />
      </header>
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <div className="card p-8">
          <h1 className="heading text-3xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-surface-subtle dark:text-night-subtle">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
          {footer ? (
            <div className="mt-6 border-t border-surface-border pt-5 text-sm text-surface-subtle dark:border-night-border dark:text-night-subtle">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
