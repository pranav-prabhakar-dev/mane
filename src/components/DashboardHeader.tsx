import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";

export function DashboardHeader({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    currency: string;
  };
}) {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link
        href="/dashboard"
        className="heading text-2xl font-medium text-brand-600 dark:text-brand-400"
      >
        Mané
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <ProfileMenu
          name={user.name}
          email={user.email}
          image={user.image}
          currency={user.currency}
        />
      </div>
    </header>
  );
}
