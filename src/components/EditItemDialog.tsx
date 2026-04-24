"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { QuantityStepper } from "./QuantityStepper";
import { CURRENCIES } from "@/lib/currency";
import { wordCount } from "@/lib/utils";
import { MAX_ITEM_DESCRIPTION_WORDS } from "@/lib/constants";
import { Check, Sparkles } from "lucide-react";
import type { RoomItem } from "@/app/room/[id]/RoomClient";

export function EditItemDialog({
  open,
  onClose,
  item,
  defaultCurrency,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  item: RoomItem;
  defaultCurrency: string;
  onUpdated: (item: RoomItem) => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(
    item.price != null ? String(item.price) : "",
  );
  const [currency, setCurrency] = useState(item.currency ?? defaultCurrency);
  const [quantity, setQuantity] = useState(item.quantity ?? 1);
  const [optional, setOptional] = useState(item.optional ?? false);
  const [purchased, setPurchased] = useState(!!item.purchasedAt);
  const [description, setDescription] = useState(item.description ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = wordCount(description);
  const tooMany = words > MAX_ITEM_DESCRIPTION_WORDS;

  async function save() {
    if (!name.trim()) {
      setError("Give your item a name.");
      return;
    }
    if (tooMany) {
      setError(`Descriptions can be up to ${MAX_ITEM_DESCRIPTION_WORDS} words.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
        imageUrl: imageUrl.trim() || null,
        currency: currency || null,
        quantity,
        optional,
        purchased,
      };
      if (price.trim()) {
        const p = Number(price.replace(/,/g, "").trim());
        if (!Number.isFinite(p) || p < 0) {
          setError("Price must be a non-negative number.");
          setSaving(false);
          return;
        }
        payload.price = p;
      } else {
        payload.price = null;
      }

      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Couldn't save.");
        return;
      }
      onUpdated({
        ...item,
        name: name.trim(),
        url: url.trim() || null,
        imageUrl: imageUrl.trim() || null,
        description: description.trim() || null,
        price: price.trim() ? Number(price.replace(/,/g, "").trim()) : null,
        currency: currency || null,
        quantity,
        optional,
        purchasedAt: purchased
          ? item.purchasedAt ?? new Date().toISOString()
          : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit item"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={save}
            disabled={saving || tooMany}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Price</label>
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Currency</label>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Quantity</label>
          <QuantityStepper value={quantity} onChange={setQuantity} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-surface-border bg-surface-raised/60 p-3 dark:border-night-border dark:bg-night-raised/60">
            <input
              type="checkbox"
              checked={optional}
              onChange={(e) => setOptional(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                Optional
              </span>
              <span className="mt-0.5 block text-xs text-surface-subtle dark:text-night-subtle">
                Nice-to-have extra.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-surface-border bg-surface-raised/60 p-3 dark:border-night-border dark:bg-night-raised/60">
            <input
              type="checkbox"
              checked={purchased}
              onChange={(e) => setPurchased(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-500"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Already purchased
              </span>
              <span className="mt-0.5 block text-xs text-surface-subtle dark:text-night-subtle">
                Drops from the subtotal.
              </span>
            </span>
          </label>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Link</label>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Photo URL</label>
          <input
            className="input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="input min-h-[90px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div
            className={`text-xs ${
              tooMany ? "text-red-600" : "text-surface-muted dark:text-night-muted"
            }`}
          >
            {words}/{MAX_ITEM_DESCRIPTION_WORDS} words
          </div>
        </div>
        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
