"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Users,
  Bell,
  Crown,
  DoorOpen,
  Home as HomeIcon,
} from "lucide-react";
import { AddHomeDialog } from "@/components/AddHomeDialog";
import { JoinHomeDialog } from "@/components/JoinHomeDialog";

type HomeTile = {
  id: string;
  name: string;
  type: "HOME" | "SINGLE_ROOM";
  isOwner: boolean;
  roomCount: number;
  memberCount: number;
  pendingRequests: number;
};

export function DashboardClient({
  homes,
  canAddMore,
}: {
  homes: HomeTile[];
  canAddMore: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (params.get("add") === "1") setAddOpen(true);
    if (params.get("join") === "1") setJoinOpen(true);
  }, [params]);

  function closeAdd() {
    setAddOpen(false);
    if (params.get("add")) router.replace("/dashboard");
  }
  function closeJoin() {
    setJoinOpen(false);
    if (params.get("join")) router.replace("/dashboard");
  }

  const isEmpty = homes.length === 0;

  return (
    <>
      {isEmpty ? (
        <div className="card mx-auto mt-8 flex max-w-xl flex-col items-center gap-5 p-10 text-center">
          <div className="flex items-center gap-2 text-brand-500">
            <HomeIcon className="h-6 w-6" />
            <DoorOpen className="h-6 w-6" />
          </div>
          <h2 className="heading text-2xl font-semibold">
            Add your first house or room to Mané
          </h2>
          <p className="max-w-sm text-surface-subtle dark:text-night-subtle">
            Plan what you'll buy, paste product links, invite the people you
            live with, and watch the total fill in — room by room.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create a space
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setJoinOpen(true)}
            >
              Join with a code
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setJoinOpen(true)}
            >
              Join with a code
            </button>
            {canAddMore ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New space
              </button>
            ) : (
              <span className="pill">You've hit your 3-space limit.</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {homes.map((h) => (
              <HomeTileCard key={h.id} home={h} />
            ))}
            {canAddMore ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="group tile aspect-square gap-3 border-dashed bg-transparent text-surface-muted hover:text-brand-600 dark:text-night-muted dark:hover:text-brand-400"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-current transition group-hover:border-brand-500 group-hover:bg-brand-500/10 group-hover:text-brand-600">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">Add another</span>
              </button>
            ) : null}
          </div>
        </>
      )}

      <AddHomeDialog open={addOpen} onClose={closeAdd} />
      <JoinHomeDialog
        open={joinOpen}
        onClose={closeJoin}
        onJoined={() => router.refresh()}
      />
    </>
  );
}

function HomeTileCard({ home }: { home: HomeTile }) {
  return (
    <Link
      href={`/home/${home.id}`}
      className="tile relative aspect-square gap-3"
    >
      {home.pendingRequests > 0 ? (
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
          title={`${home.pendingRequests} pending ${home.pendingRequests === 1 ? "request" : "requests"}`}
        >
          <Bell className="h-3 w-3" />
          {home.pendingRequests}
        </span>
      ) : null}
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        {home.type === "SINGLE_ROOM" ? (
          <DoorOpen className="h-6 w-6" />
        ) : (
          <HomeIcon className="h-6 w-6" />
        )}
      </span>
      <div className="px-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="line-clamp-1 font-medium">{home.name}</span>
          {home.isOwner ? (
            <Crown className="h-3.5 w-3.5 text-brand-500" />
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-surface-subtle dark:text-night-subtle">
          <span>
            {home.roomCount} {home.roomCount === 1 ? "room" : "rooms"}
          </span>
          <span aria-hidden>•</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {home.memberCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
