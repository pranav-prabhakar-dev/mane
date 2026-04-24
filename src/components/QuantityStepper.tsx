"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function clamp(n: number) {
    if (!Number.isFinite(n)) return value;
    return Math.min(max, Math.max(min, Math.round(n)));
  }

  function commit() {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) {
      onChange(clamp(n));
    } else {
      setDraft(String(value));
    }
    setEditing(false);
  }

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-surface-border bg-surface-raised/80 p-0.5 dark:border-night-border dark:bg-night-raised/80">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={atMin}
        aria-label="Decrease quantity"
        className="grid h-7 w-7 place-items-center rounded-full text-surface-subtle transition hover:bg-surface-sunken hover:text-surface-text disabled:cursor-not-allowed disabled:opacity-40 dark:text-night-subtle dark:hover:bg-night-sunken dark:hover:text-night-text"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft(String(value));
              setEditing(false);
            }
          }}
          className="h-7 w-10 rounded-full bg-transparent text-center text-sm font-medium outline-none"
          aria-label="Quantity"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="h-7 min-w-[2.5rem] rounded-full px-2 text-center text-sm font-medium tabular-nums text-surface-text transition hover:bg-surface-sunken dark:text-night-text dark:hover:bg-night-sunken"
          aria-label={`Quantity ${value} — click to edit`}
        >
          {value}
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={atMax}
        aria-label="Increase quantity"
        className="grid h-7 w-7 place-items-center rounded-full text-surface-subtle transition hover:bg-surface-sunken hover:text-surface-text disabled:cursor-not-allowed disabled:opacity-40 dark:text-night-subtle dark:hover:bg-night-sunken dark:hover:text-night-text"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
