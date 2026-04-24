"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Users,
  Trash2,
  Bell,
  Crown,
  DoorOpen,
  Home as HomeIcon,
  LogOut,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { RenameDialog } from "@/components/RenameDialog";
import { CopyButton } from "@/components/CopyButton";
import { formatMoney } from "@/lib/currency";
import { MAX_ROOMS_PER_HOME } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

type Room = {
  id: string;
  name: string;
  itemCount: number;
  toBuyCount: number;
  subtotal: number;
  subtotalWithOptional: number;
  purchasedTotal: number;
};

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isOwner: boolean;
};

type JoinReq = {
  id: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
};

export function HomeClient({
  home,
  rooms,
  members,
  requests,
  currency,
  currentUserId,
}: {
  home: {
    id: string;
    name: string;
    type: "HOME" | "SINGLE_ROOM";
    joinCode: string;
    isOwner: boolean;
    ownerId: string;
  };
  rooms: Room[];
  members: Member[];
  requests: JoinReq[];
  currency: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [renameHomeOpen, setRenameHomeOpen] = useState(false);
  const [renamingRoom, setRenamingRoom] = useState<Room | null>(null);
  const [includeOptional, setIncludeOptional] = useState(true);

  const homeTotal = rooms.reduce(
    (s, r) => s + (includeOptional ? r.subtotalWithOptional : r.subtotal),
    0,
  );
  const homePurchasedTotal = rooms.reduce(
    (s, r) => s + r.purchasedTotal,
    0,
  );
  const hasOptional = rooms.some(
    (r) => r.subtotalWithOptional !== r.subtotal,
  );
  const canAddRoom =
    home.type === "HOME" && rooms.length < MAX_ROOMS_PER_HOME;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-surface-subtle dark:text-night-subtle">
            {home.type === "SINGLE_ROOM" ? (
              <>
                <DoorOpen className="h-4 w-4" />
                <span>Single room</span>
              </>
            ) : (
              <>
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </>
            )}
            {home.isOwner ? (
              <>
                <span aria-hidden>·</span>
                <Crown className="h-3.5 w-3.5 text-brand-500" />
                <span>You own this space</span>
              </>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="heading text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
              {home.name}
            </h1>
            {home.isOwner ? (
              <button
                type="button"
                onClick={() => setRenameHomeOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-full text-surface-muted transition hover:bg-surface-sunken hover:text-surface-text dark:text-night-muted dark:hover:bg-night-sunken dark:hover:text-night-text"
                aria-label="Rename home"
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-surface-subtle dark:text-night-subtle">
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
            <span className="mx-2" aria-hidden>·</span>
            Total to buy{" "}
            <span className="font-medium text-surface-text dark:text-night-text">
              {formatMoney(homeTotal, currency)}
            </span>
            {homePurchasedTotal > 0 ? (
              <>
                <span className="mx-2" aria-hidden>·</span>
                <span className="text-xs">
                  {formatMoney(homePurchasedTotal, currency)} already bought
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="btn-outline"
          >
            <Users className="h-4 w-4" />
            Members ({members.length})
          </button>
          {home.isOwner ? (
            <button
              type="button"
              onClick={() => setRequestsOpen(true)}
              className={`btn-outline relative ${
                requests.length > 0 ? "border-brand-500 text-brand-700 dark:text-brand-300" : ""
              }`}
            >
              <Bell className="h-4 w-4" />
              Requests
              {requests.length > 0 ? (
                <span className="ml-1 inline-grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-semibold text-white">
                  {requests.length}
                </span>
              ) : null}
            </button>
          ) : null}
          {home.isOwner ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="btn-danger"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLeaveOpen(true)}
              className="btn-danger"
            >
              <LogOut className="h-4 w-4" />
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Join code strip */}
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-raised/50 px-4 py-3 dark:border-night-border dark:bg-night-raised/50">
        <span className="text-sm text-surface-subtle dark:text-night-subtle">
          Share this code with the people you live with:
        </span>
        <code className="rounded-lg bg-surface-sunken px-2 py-1 font-mono text-sm text-surface-text dark:bg-night-sunken dark:text-night-text">
          {home.joinCode}
        </code>
        <CopyButton value={home.joinCode} label="Copy code" />
      </div>

      {/* Rooms grid */}
      <div className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="heading text-2xl font-semibold">Rooms</h2>
          <div className="flex items-center gap-2">
            {hasOptional ? (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-surface-border bg-surface-raised/60 px-3 py-1.5 text-sm dark:border-night-border dark:bg-night-raised/60">
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
            {home.type === "HOME" ? (
              canAddRoom ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setAddRoomOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add a room
                </button>
              ) : (
                <span className="pill">Room limit reached (8 of 8)</span>
              )
            ) : null}
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="card p-10 text-center">
            <h3 className="heading text-xl font-semibold">
              {home.type === "SINGLE_ROOM"
                ? "Your room's ready. Add items to start planning."
                : "No rooms yet. Add the first one."}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-surface-subtle dark:text-night-subtle">
              Think bedrooms, kitchen, living room — whatever you need to plan
              purchases for.
            </p>
            {home.type === "HOME" ? (
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() => setAddRoomOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add your first room
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="card group relative overflow-hidden p-5 transition hover:shadow-tileHover hover:-translate-y-0.5"
              >
                <Link
                  href={`/room/${r.id}`}
                  aria-label={`Open ${r.name}`}
                  className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                />
                <div className="pointer-events-none relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="heading truncate text-lg font-semibold">
                        {r.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setRenamingRoom(r)}
                        className="pointer-events-auto grid h-7 w-7 flex-none place-items-center rounded-full text-surface-muted opacity-0 transition hover:bg-surface-sunken hover:text-surface-text focus:opacity-100 group-hover:opacity-100 dark:text-night-muted dark:hover:bg-night-sunken dark:hover:text-night-text"
                        aria-label={`Rename ${r.name}`}
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-surface-subtle dark:text-night-subtle">
                      {r.toBuyCount} to buy
                      {r.itemCount - r.toBuyCount > 0
                        ? ` · ${r.itemCount - r.toBuyCount} bought`
                        : ""}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-300">
                    <DoorOpen className="h-4 w-4" />
                  </span>
                </div>
                <div className="pointer-events-none relative mt-6 flex items-end justify-between">
                  <span className="text-xs text-surface-subtle dark:text-night-subtle">
                    Subtotal
                  </span>
                  <span className="heading text-xl font-semibold">
                    {formatMoney(
                      includeOptional ? r.subtotalWithOptional : r.subtotal,
                      currency,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddRoomModal
        open={addRoomOpen}
        onClose={() => setAddRoomOpen(false)}
        homeId={home.id}
      />
      <MembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        members={members}
        currentUserId={currentUserId}
        currentUserIsOwner={home.isOwner}
        homeId={home.id}
      />
      <RequestsModal
        open={requestsOpen}
        onClose={() => setRequestsOpen(false)}
        homeId={home.id}
        requests={requests}
      />
      <DeleteHomeModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        homeId={home.id}
        homeName={home.name}
      />
      <LeaveHomeModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        homeId={home.id}
        homeName={home.name}
      />
      <RenameDialog
        open={renameHomeOpen}
        onClose={() => setRenameHomeOpen(false)}
        title="Rename home"
        currentName={home.name}
        endpoint={`/api/homes/${home.id}`}
        onRenamed={() => router.refresh()}
      />
      <RenameDialog
        open={!!renamingRoom}
        onClose={() => setRenamingRoom(null)}
        title="Rename room"
        currentName={renamingRoom?.name ?? ""}
        endpoint={renamingRoom ? `/api/rooms/${renamingRoom.id}` : ""}
        maxLength={40}
        onRenamed={() => router.refresh()}
      />
    </>
  );

  function AddRoomModal({
    open,
    onClose,
    homeId,
  }: {
    open: boolean;
    onClose: () => void;
    homeId: string;
  }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    async function submit() {
      if (!name.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/homes/${homeId}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error ?? "Couldn't add room.");
          return;
        }
        setName("");
        onClose();
        router.refresh();
      } finally {
        setLoading(false);
      }
    }
    return (
      <Modal open={open} onClose={onClose} title="Add a room">
        <div className="space-y-3">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kitchen"
            maxLength={40}
            autoFocus
          />
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
              onClick={submit}
              disabled={loading || !name.trim()}
            >
              {loading ? "Adding…" : "Add room"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

function MembersModal({
  open,
  onClose,
  members,
  currentUserId,
  currentUserIsOwner,
  homeId,
}: {
  open: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string;
  currentUserIsOwner: boolean;
  homeId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function removeMember(userId: string, isSelf: boolean, label: string) {
    const msg = isSelf
      ? `Leave this home? You'll lose access.`
      : `Remove ${label} from this home? They'll lose access immediately.`;
    if (!confirm(msg)) return;
    setPendingId(userId);
    setError(null);
    try {
      const res = await fetch(
        `/api/homes/${homeId}/members/${userId}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't complete that action.");
        return;
      }
      if (isSelf) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Members">
      {error ? (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-surface-border dark:divide-night-border">
        {members.map((m) => {
          const isSelf = m.id === currentUserId;
          const canRemove = currentUserIsOwner && !m.isOwner;
          const canLeave = isSelf && !m.isOwner;
          return (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <Avatar name={m.name} email={m.email} image={m.image} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">
                    {m.name ?? m.email}
                  </span>
                  {m.isOwner ? (
                    <Crown
                      className="h-3.5 w-3.5 text-brand-500"
                      aria-label="Owner"
                    />
                  ) : null}
                  {isSelf ? <span className="pill">You</span> : null}
                </div>
                <div className="truncate text-xs text-surface-subtle dark:text-night-subtle">
                  {m.email}
                </div>
              </div>
              {canLeave ? (
                <button
                  type="button"
                  onClick={() =>
                    removeMember(m.id, true, m.name ?? m.email ?? "you")
                  }
                  disabled={pendingId === m.id}
                  className="btn-danger text-xs"
                >
                  {pendingId === m.id ? "Leaving…" : "Leave"}
                </button>
              ) : canRemove ? (
                <button
                  type="button"
                  onClick={() =>
                    removeMember(m.id, false, m.name ?? m.email ?? "this member")
                  }
                  disabled={pendingId === m.id}
                  className="btn-danger text-xs"
                  title="Remove member"
                >
                  {pendingId === m.id ? "Removing…" : "Remove"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function RequestsModal({
  open,
  onClose,
  homeId,
  requests,
}: {
  open: boolean;
  onClose: () => void;
  homeId: string;
  requests: JoinReq[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(reqId: string, action: "APPROVE" | "REJECT") {
    setPending(reqId);
    setErr(null);
    try {
      const res = await fetch(`/api/homes/${homeId}/requests/${reqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error ?? "Couldn't update.");
      } else {
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join requests">
      {requests.length === 0 ? (
        <p className="text-sm text-surface-subtle dark:text-night-subtle">
          No pending requests. When someone enters your join code, they'll show
          up here for you to approve.
        </p>
      ) : (
        <>
          {err ? (
            <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {err}
            </p>
          ) : null}
          <ul className="divide-y divide-surface-border dark:divide-night-border">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 py-3"
              >
                <Avatar
                  name={r.user.name}
                  email={r.user.email}
                  image={r.user.image}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {r.user.name ?? r.user.email}
                  </p>
                  <p className="truncate text-xs text-surface-subtle dark:text-night-subtle">
                    {r.user.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => act(r.id, "REJECT")}
                    disabled={pending === r.id}
                    className="btn-ghost text-xs"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => act(r.id, "APPROVE")}
                    disabled={pending === r.id}
                    className="btn-primary text-xs"
                  >
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

function DeleteHomeModal({
  open,
  onClose,
  homeId,
  homeName,
}: {
  open: boolean;
  onClose: () => void;
  homeId: string;
  homeName: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/homes/${homeId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Delete this space?">
      <p className="text-sm text-surface-subtle dark:text-night-subtle">
        This removes all rooms and items for everyone. This can't be undone.
        Type <span className="font-medium">{homeName}</span> to confirm.
      </p>
      <input
        className="input mt-3"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-danger bg-red-500/10 hover:bg-red-500/20"
          onClick={submit}
          disabled={loading || confirm !== homeName}
        >
          {loading ? "Deleting…" : "Delete space"}
        </button>
      </div>
    </Modal>
  );
}

function LeaveHomeModal({
  open,
  onClose,
  homeId,
  homeName,
}: {
  open: boolean;
  onClose: () => void;
  homeId: string;
  homeName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/homes/${homeId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Leave this space?">
      <p className="text-sm text-surface-subtle dark:text-night-subtle">
        You'll lose access to <span className="font-medium">{homeName}</span>. The
        owner can invite you back with the same code.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Stay
        </button>
        <button
          className="btn-danger bg-red-500/10 hover:bg-red-500/20"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Leaving…" : "Leave"}
        </button>
      </div>
    </Modal>
  );
}

function Avatar({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  if (image) {
    return (
      <span className="inline-block h-9 w-9 overflow-hidden rounded-full bg-surface-sunken dark:bg-night-sunken">
        <Image
          src={image}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-xs font-semibold text-white">
      {getInitials(name, email)}
    </span>
  );
}
