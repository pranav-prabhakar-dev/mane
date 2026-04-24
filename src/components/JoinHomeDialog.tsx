"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function JoinHomeDialog({
  open,
  onClose,
  onJoined,
}: {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't send request.");
        return;
      }
      setSuccess(
        `Request sent${data.homeName ? ` to ${data.homeName}` : ""}. You'll get access once the owner approves.`,
      );
      onJoined();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join a home">
      <div className="space-y-3">
        <p className="text-sm text-surface-subtle dark:text-night-subtle">
          Enter the join code your friend or family member shared with you.
          The owner will approve your request.
        </p>
        <input
          className="input font-mono tracking-wide"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="amber-otter-42"
          autoFocus
        />
        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-sm text-brand-700 dark:text-brand-300">
            {success}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={submit}
            disabled={loading || !code.trim()}
          >
            {loading ? "Sending…" : "Request to join"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
