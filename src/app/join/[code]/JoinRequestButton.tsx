"use client";

import Link from "next/link";
import { useState } from "react";

export function JoinRequestButton({
  joinCode,
  homeId,
  alreadyPending,
}: {
  joinCode: string;
  homeId: string;
  alreadyPending: boolean;
}) {
  const [state, setState] = useState<"idle" | "sent" | "error">(
    alreadyPending ? "sent" : "idle",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(data?.error ?? "Couldn't send request.");
        return;
      }
      setState("sent");
      setMessage(
        "Request sent. You'll see the space on your dashboard once the owner approves.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {state !== "sent" ? (
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="btn-primary w-full justify-center py-2.5 text-[15px]"
        >
          {loading ? "Sending…" : "Request to join"}
        </button>
      ) : null}
      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state === "error"
              ? "bg-red-500/10 text-red-700 dark:text-red-300"
              : "bg-brand-500/10 text-brand-700 dark:text-brand-300"
          }`}
        >
          {message}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <Link href="/dashboard" className="btn-ghost text-sm">
          Back to dashboard
        </Link>
        <span className="text-xs text-surface-muted dark:text-night-muted">
          Home ID: <code className="font-mono">{homeId.slice(0, 6)}…</code>
        </span>
      </div>
    </div>
  );
}
