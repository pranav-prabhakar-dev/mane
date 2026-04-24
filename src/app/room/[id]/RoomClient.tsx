"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  Trash2,
  Pencil,
  Package,
  RefreshCw,
  Check,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { AddItemDialog } from "@/components/AddItemDialog";
import { EditItemDialog } from "@/components/EditItemDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { getInitials, timeAgo, formatDateTime, wordCount } from "@/lib/utils";
import { MAX_ITEM_DESCRIPTION_WORDS } from "@/lib/constants";

export type RoomItem = {
  id: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  quantity: number;
  optional: boolean;
  purchasedAt: string | null;
  description: string | null;
  createdAt: string;
  addedBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export function RoomClient({
  room,
  home,
  initialItems,
  currency,
  currentUserId,
}: {
  room: { id: string; name: string; homeId: string };
  home: { id: string; name: string; ownerId: string; type: "HOME" | "SINGLE_ROOM" };
  initialItems: RoomItem[];
  currency: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<RoomItem[]>(initialItems);
  const [roomName, setRoomName] = useState(room.name);
  const [includeOptional, setIncludeOptional] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomItem | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canDeleteRoom =
    home.ownerId === currentUserId && home.type !== "SINGLE_ROOM";

  async function deleteRoom() {
    if (
      !confirm(
        `Delete "${roomName}" and all its items? This can't be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Couldn't delete the room.");
        return;
      }
      router.push(`/home/${home.id}`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const { subtotal, purchasedTotal, pendingCount, purchasedCount } = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          const lineTotal = (it.price ?? 0) * (it.quantity ?? 1);
          if (it.purchasedAt) {
            acc.purchasedTotal += lineTotal;
            acc.purchasedCount += 1;
          } else {
            const include = includeOptional || !it.optional;
            if (include) acc.subtotal += lineTotal;
            acc.pendingCount += 1;
          }
          return acc;
        },
        {
          subtotal: 0,
          purchasedTotal: 0,
          pendingCount: 0,
          purchasedCount: 0,
        },
      ),
    [items, includeOptional],
  );

  async function refresh() {
    setRefreshing(true);
    try {
      router.refresh();
      await new Promise((r) => setTimeout(r, 300));
    } finally {
      setRefreshing(false);
    }
  }

  function handleCreated(newItem: RoomItem) {
    setItems((prev) => [newItem, ...prev]);
  }
  function handleUpdated(updated: RoomItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }
  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function togglePurchased(it: RoomItem) {
    const next = !it.purchasedAt;
    // Optimistic
    setItems((prev) =>
      prev.map((x) =>
        x.id === it.id
          ? {
              ...x,
              purchasedAt: next ? new Date().toISOString() : null,
            }
          : x,
      ),
    );
    const res = await fetch(`/api/items/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased: next }),
    });
    if (!res.ok) {
      // revert on failure
      setItems((prev) =>
        prev.map((x) =>
          x.id === it.id ? { ...x, purchasedAt: it.purchasedAt } : x,
        ),
      );
    }
  }

  async function toggleOptional(it: RoomItem) {
    const next = !it.optional;
    setItems((prev) =>
      prev.map((x) => (x.id === it.id ? { ...x, optional: next } : x)),
    );
    const res = await fetch(`/api/items/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optional: next }),
    });
    if (!res.ok) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === it.id ? { ...x, optional: it.optional } : x,
        ),
      );
    }
  }

  const canDelete = (it: RoomItem) =>
    it.addedBy.id === currentUserId || home.ownerId === currentUserId;

  const hasOptional = items.some((it) => it.optional && !it.purchasedAt);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm text-surface-subtle dark:text-night-subtle">
            In {home.name}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <h1 className="heading text-4xl font-semibold tracking-tight">
              {roomName}
            </h1>
            <button
              type="button"
              onClick={() => setRenameOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-full text-surface-muted transition hover:bg-surface-sunken hover:text-surface-text dark:text-night-muted dark:hover:bg-night-sunken dark:hover:text-night-text"
              aria-label="Rename room"
              title="Rename"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {canDeleteRoom ? (
              <button
                type="button"
                onClick={deleteRoom}
                disabled={deleting}
                className="grid h-8 w-8 place-items-center rounded-full text-surface-muted transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:text-night-muted dark:hover:text-red-300"
                aria-label="Delete room"
                title="Delete room"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-surface-subtle dark:text-night-subtle">
            {pendingCount} to buy
            {purchasedCount > 0 ? ` · ${purchasedCount} purchased` : ""}
          </p>
        </div>

        <div className="card flex min-w-[220px] flex-col gap-1 px-5 py-4">
          <div className="text-xs uppercase tracking-wider text-surface-muted dark:text-night-muted">
            Subtotal to buy
          </div>
          <div className="heading text-3xl font-semibold">
            {formatMoney(subtotal, currency)}
          </div>
          {purchasedTotal > 0 ? (
            <div className="text-xs text-surface-subtle dark:text-night-subtle">
              + {formatMoney(purchasedTotal, currency)} already bought
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add an item
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={refresh}
          disabled={refreshing}
          title="Refresh — pull in anything your housemates added"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        {hasOptional ? (
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-surface-border bg-surface-raised/60 px-3 py-1.5 text-sm dark:border-night-border dark:bg-night-raised/60">
            <input
              type="checkbox"
              checked={includeOptional}
              onChange={(e) => setIncludeOptional(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Include optional
          </label>
        ) : null}
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyRoom onAdd={() => setAddOpen(true)} />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                currency={currency}
                canDelete={canDelete(it)}
                includeOptional={includeOptional}
                onEdit={() => setEditingItem(it)}
                onTogglePurchased={() => togglePurchased(it)}
                onToggleOptional={() => toggleOptional(it)}
                onDelete={async () => {
                  const ok = confirm(`Remove "${it.name}" from ${roomName}?`);
                  if (!ok) return;
                  const res = await fetch(`/api/items/${it.id}`, {
                    method: "DELETE",
                  });
                  if (res.ok) handleDeleted(it.id);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <AddItemDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        roomId={room.id}
        defaultCurrency={currency}
        onCreated={handleCreated}
      />
      {editingItem ? (
        <EditItemDialog
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
          defaultCurrency={currency}
          onUpdated={handleUpdated}
        />
      ) : null}
      <RenameDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename room"
        currentName={roomName}
        endpoint={`/api/rooms/${room.id}`}
        maxLength={40}
        onRenamed={(newName) => {
          setRoomName(newName);
          router.refresh();
        }}
      />
    </>
  );
}

function ItemCard({
  item,
  currency,
  canDelete,
  includeOptional,
  onEdit,
  onTogglePurchased,
  onToggleOptional,
  onDelete,
}: {
  item: RoomItem;
  currency: string;
  canDelete: boolean;
  includeOptional: boolean;
  onEdit: () => void;
  onTogglePurchased: () => void;
  onToggleOptional: () => void;
  onDelete: () => void;
}) {
  const displayCurrency = item.currency || currency;
  const words = item.description ? wordCount(item.description) : 0;
  const purchased = !!item.purchasedAt;
  const dimmed =
    purchased || (item.optional && !includeOptional);

  return (
    <li
      className={`card flex gap-4 overflow-hidden p-4 transition ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-none flex-col items-center gap-2">
        <button
          type="button"
          onClick={onTogglePurchased}
          aria-label={purchased ? "Mark as not purchased" : "Mark as purchased"}
          title={purchased ? "Purchased" : "Mark as purchased"}
          className={`grid h-6 w-6 place-items-center rounded-full border transition ${
            purchased
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-surface-border bg-surface-raised text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-night-border dark:bg-night-raised"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>

        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-surface-sunken dark:bg-night-sunken">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              width={96}
              height={96}
              unoptimized
              className={`h-full w-full object-cover ${
                purchased ? "grayscale" : ""
              }`}
            />
          ) : (
            <Package className="h-6 w-6 text-surface-muted dark:text-night-muted" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3
                className={`font-medium leading-snug ${
                  purchased ? "line-through" : ""
                }`}
              >
                {item.name}
              </h3>
              {item.optional ? (
                <button
                  type="button"
                  onClick={onToggleOptional}
                  className="pill bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
                  title="Click to mark as a necessity"
                >
                  <Sparkles className="h-3 w-3" />
                  optional
                </button>
              ) : null}
              {purchased ? (
                <span className="pill bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  purchased
                </span>
              ) : null}
            </div>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
              >
                <ExternalLink className="h-3 w-3" />
                Open product
              </a>
            ) : null}
          </div>
          <div className="text-right">
            <div className="heading text-lg font-semibold">
              {item.price != null
                ? formatMoney(
                    item.price * (item.quantity ?? 1),
                    displayCurrency,
                  )
                : "—"}
            </div>
            {item.quantity > 1 && item.price != null ? (
              <div className="text-[11px] text-surface-muted dark:text-night-muted">
                {formatMoney(item.price, displayCurrency)} × {item.quantity}
              </div>
            ) : null}
            {item.currency && item.currency !== currency ? (
              <div className="text-[11px] text-surface-muted dark:text-night-muted">
                listed in {item.currency}
              </div>
            ) : null}
          </div>
        </div>

        {item.description ? (
          <p className="mt-1.5 line-clamp-3 text-sm text-surface-subtle dark:text-night-subtle">
            {item.description}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-surface-muted dark:text-night-muted">
            <Avatar addedBy={item.addedBy} />
            <span className="truncate">
              {item.addedBy.name ?? item.addedBy.email}
            </span>
            <span aria-hidden>·</span>
            <span title={formatDateTime(item.createdAt)}>
              {timeAgo(item.createdAt)}
            </span>
            {words > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span
                  className={
                    words > MAX_ITEM_DESCRIPTION_WORDS ? "text-red-600" : ""
                  }
                >
                  {words} {words === 1 ? "word" : "words"}
                </span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="grid h-7 w-7 place-items-center rounded-lg text-surface-muted transition hover:bg-surface-sunken dark:text-night-muted dark:hover:bg-night-sunken"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="grid h-7 w-7 place-items-center rounded-lg text-red-600 transition hover:bg-red-500/10 dark:text-red-300"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function Avatar({
  addedBy,
}: {
  addedBy: { name: string | null; email: string | null; image: string | null };
}) {
  if (addedBy.image) {
    return (
      <span className="inline-block h-5 w-5 overflow-hidden rounded-full">
        <Image
          src={addedBy.image}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[9px] font-semibold text-white">
      {getInitials(addedBy.name, addedBy.email)}
    </span>
  );
}

function EmptyRoom({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <Package className="h-6 w-6" />
      </div>
      <h3 className="heading mt-4 text-xl font-semibold">
        Nothing here yet — add your first item.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-surface-subtle dark:text-night-subtle">
        Paste a product link and we'll do our best to grab the photo and price
        automatically.
      </p>
      <button type="button" className="btn-primary mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add an item
      </button>
    </div>
  );
}
