"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { QuantityStepper } from "./QuantityStepper";
import { CURRENCIES } from "@/lib/currency";
import { wordCount } from "@/lib/utils";
import { MAX_ITEM_DESCRIPTION_WORDS } from "@/lib/constants";
import { Link as LinkIcon, Package, Sparkles } from "lucide-react";
import type { RoomItem } from "@/app/room/[id]/RoomClient";

export function AddItemDialog({
  open,
  onClose,
  roomId,
  defaultCurrency,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  defaultCurrency: string;
  onCreated: (item: RoomItem) => void;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [quantity, setQuantity] = useState(1);
  const [optional, setOptional] = useState(false);
  const [description, setDescription] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setName("");
      setImageUrl(undefined);
      setPrice("");
      setCurrency(defaultCurrency);
      setQuantity(1);
      setOptional(false);
      setDescription("");
      setError(null);
      setFetchMessage(null);
      setFetching(false);
      setSaving(false);
    }
  }, [open, defaultCurrency]);

  async function pullMetadata(u: string) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setFetching(true);
    setFetchMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/fetch-metadata?url=${encodeURIComponent(u)}`,
        { signal: ac.signal },
      );
      const data = await res.json().catch(() => ({}));
      if (data?.error) {
        setFetchMessage(
          "Couldn't read that page automatically — you can fill in the rest by hand.",
        );
      }
      if (data?.title && !name) setName(data.title);
      if (data?.image) setImageUrl(data.image);
      if (typeof data?.price === "number") setPrice(String(data.price));
      if (data?.currency) setCurrency(data.currency);
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setFetchMessage("Couldn't reach that page — fill in the rest by hand.");
      }
    } finally {
      setFetching(false);
    }
  }

  function onUrlBlur() {
    const u = url.trim();
    if (!u) return;
    try {
      const parsed = new URL(u);
      if (!/^https?:$/.test(parsed.protocol)) return;
      pullMetadata(parsed.toString());
    } catch {
      setFetchMessage("That doesn't look like a valid URL.");
    }
  }

  async function save() {
    if (!name.trim()) {
      setError("Give your item a name.");
      return;
    }
    const desc = description.trim();
    if (desc && wordCount(desc) > MAX_ITEM_DESCRIPTION_WORDS) {
      setError(`Descriptions can be up to ${MAX_ITEM_DESCRIPTION_WORDS} words.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: desc || undefined,
      };
      if (url.trim()) payload.url = url.trim();
      if (imageUrl) payload.imageUrl = imageUrl;
      if (price.trim()) {
        const p = Number(price.replace(/,/g, "").trim());
        if (!Number.isFinite(p) || p < 0) {
          setError("Price must be a non-negative number.");
          setSaving(false);
          return;
        }
        payload.price = p;
      }
      if (currency) payload.currency = currency;
      payload.quantity = quantity;
      payload.optional = optional;

      const res = await fetch(`/api/rooms/${roomId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't add that item.");
        return;
      }
      onCreated(data.item);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const words = wordCount(description);
  const tooMany = words > MAX_ITEM_DESCRIPTION_WORDS;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add an item"
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
            disabled={saving || fetching || tooMany}
          >
            {saving ? "Adding…" : "Add item"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-xl bg-surface-sunken dark:bg-night-sunken">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={160}
              height={160}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-surface-muted dark:text-night-muted" />
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product link</label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-muted dark:text-night-muted" />
              <input
                className="input pl-9"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={onUrlBlur}
                placeholder="https://…"
                inputMode="url"
              />
            </div>
            <p className="text-xs text-surface-muted dark:text-night-muted">
              {fetching
                ? "Reading the page…"
                : fetchMessage
                  ? fetchMessage
                  : "Paste a link and we'll grab the photo and price when we can."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Item name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. Linen curtains"
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

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-border bg-surface-raised/60 p-3 dark:border-night-border dark:bg-night-raised/60">
            <input
              type="checkbox"
              checked={optional}
              onChange={(e) => setOptional(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                Mark as optional
              </span>
              <span className="mt-0.5 block text-xs text-surface-subtle dark:text-night-subtle">
                Nice-to-have, not a necessity. You can toggle "Include optional"
                in the room to see costs with or without these.
              </span>
            </span>
          </label>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description{" "}
              <span className="text-xs text-surface-muted dark:text-night-muted">
                (optional)
              </span>
            </label>
            <textarea
              className="input min-h-[90px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quick note — why this one, preferred colour, etc."
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  tooMany
                    ? "text-red-600"
                    : "text-surface-muted dark:text-night-muted"
                }
              >
                {words}/{MAX_ITEM_DESCRIPTION_WORDS} words
              </span>
            </div>
          </div>

          {imageUrl ? (
            <button
              type="button"
              onClick={() => setImageUrl(undefined)}
              className="btn-ghost text-xs"
            >
              Remove photo
            </button>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
