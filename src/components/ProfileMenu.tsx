"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { CURRENCIES } from "@/lib/currency";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

export function ProfileMenu({
  name,
  email,
  image,
  currency,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name ?? "");
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draftName, currency: draftCurrency }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Couldn't save.");
        return;
      }
      setEditing(false);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised/80 py-1 pl-1 pr-3 text-sm font-medium transition hover:bg-surface-sunken dark:border-night-border dark:bg-night-raised/80 dark:hover:bg-night-sunken"
      >
        <Avatar name={name} email={email} image={image} />
        <span className="hidden max-w-[120px] truncate sm:inline">
          {name || (email ?? "Account")}
        </span>
        <ChevronDown className="h-4 w-4 text-surface-muted dark:text-night-muted" />
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 origin-top-right rounded-2xl border border-surface-border bg-surface-raised p-4 shadow-tileHover dark:border-night-border dark:bg-night-raised">
          <div className="flex items-center gap-3">
            <Avatar name={name} email={email} image={image} size={44} />
            <div className="min-w-0">
              <p className="truncate font-medium">{name || "—"}</p>
              <p className="truncate text-xs text-surface-subtle dark:text-night-subtle">
                {email}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-surface-border pt-4 dark:border-night-border">
            {!editing ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-subtle dark:text-night-subtle">
                    Currency
                  </span>
                  <span className="font-medium">{currency}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="btn-outline text-xs"
                    onClick={() => setEditing(true)}
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    Edit profile
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Name</label>
                  <input
                    className="input"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Currency</label>
                  <select
                    className="input"
                    value={draftCurrency}
                    onChange={(e) => setDraftCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {error ? (
                  <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
                ) : null}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="btn-primary text-xs"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({
  name,
  email,
  image,
  size = 28,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <span
        className="inline-block overflow-hidden rounded-full bg-surface-sunken dark:bg-night-sunken"
        style={{ width: size, height: size }}
      >
        <Image
          src={image}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full bg-brand-500 text-[11px] font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {getInitials(name, email)}
    </span>
  );
}
