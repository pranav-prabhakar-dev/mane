"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative flex w-full ${
          size === "lg" ? "max-w-2xl" : "max-w-md"
        } max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-tileHover dark:border-night-border dark:bg-night-raised`}
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b border-surface-border px-6 py-4 dark:border-night-border">
          <h2 className="heading text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-surface-muted transition hover:bg-surface-sunken dark:text-night-muted dark:hover:bg-night-sunken"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mane-modal-scroll flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer ? (
          <div className="flex-none border-t border-surface-border bg-surface-raised px-6 py-4 shadow-[0_-8px_16px_-12px_rgba(24,22,18,0.15)] dark:border-night-border dark:bg-night-raised dark:shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.4)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
