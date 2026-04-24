"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";

export function RenameDialog({
  open,
  onClose,
  title,
  currentName,
  endpoint,
  method = "PATCH",
  maxLength = 60,
  onRenamed,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  currentName: string;
  endpoint: string;
  method?: "PATCH" | "PUT";
  maxLength?: number;
  onRenamed?: (newName: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
      setLoading(false);
    }
  }, [open, currentName]);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Couldn't rename.");
        return;
      }
      onRenamed?.(trimmed);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) submit();
          }}
          maxLength={maxLength}
          autoFocus
        />
        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={loading || !name.trim()}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
