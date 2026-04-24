"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Home as HomeIcon, DoorOpen } from "lucide-react";

export function AddHomeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"HOME" | "SINGLE_ROOM">("HOME");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't create it.");
        return;
      }
      onClose();
      setName("");
      router.push(`/home/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a new space">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TypeCard
            selected={type === "HOME"}
            onSelect={() => setType("HOME")}
            icon={<HomeIcon className="h-5 w-5" />}
            title="Home / flat"
            desc="Up to 8 rooms to plan together."
          />
          <TypeCard
            selected={type === "SINGLE_ROOM"}
            onSelect={() => setType("SINGLE_ROOM")}
            icon={<DoorOpen className="h-5 w-5" />}
            title="Single room"
            desc="Just one room — quick list."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {type === "HOME" ? "Name your home" : "Name your room"}
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "HOME" ? "e.g. Beach Cottage" : "e.g. My Studio"
            }
            maxLength={60}
            autoFocus
          />
        </div>
        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={create}
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TypeCard({
  selected,
  onSelect,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-400/40 dark:bg-brand-500/10"
          : "border-surface-border bg-surface-raised hover:bg-surface-sunken dark:border-night-border dark:bg-night-raised dark:hover:bg-night-sunken"
      }`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full ${
          selected
            ? "bg-brand-500 text-white"
            : "bg-surface-sunken text-surface-text dark:bg-night-sunken dark:text-night-text"
        }`}
      >
        {icon}
      </span>
      <span className="font-medium">{title}</span>
      <span className="text-xs text-surface-subtle dark:text-night-subtle">
        {desc}
      </span>
    </button>
  );
}
