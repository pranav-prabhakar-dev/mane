"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currency";

export function OnboardingForm({
  initialCurrency,
  initialName,
}: {
  initialCurrency: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, currency }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Couldn't save.");
        return;
      }
      // mark onboarded via dedicated endpoint
      await fetch("/api/onboarding/complete", { method: "POST" });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!initialName ? (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Your name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            maxLength={80}
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Currency</label>
        <select
          className="input"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label} ({c.symbol})
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-[15px]">
        {loading ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
