"use client";

import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "@/context/session-context";

type Row = {
  id: string;
  type: string;
  actor: { handle: string; name: string; avatarUrl: string };
  post?: { id: string; body: string; author?: { handle: string } };
  createdAt: string;
};

export default function NotificationsPage() {
  const { authFetch } = useSession();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void authFetch("/api/notifications").then(async (r) => {
      const d = await r.json();
      setRows(d.items ?? []);
    });
    void authFetch("/api/notifications", { method: "PATCH" });
  }, [authFetch]);

  return (
    <div className="divide-y divide-plume-edge min-h-[560px]">
      {rows.map((n) => (
        <div key={n.id} className="flex gap-3 px-4 py-4">
          <Link href={`/${n.actor.handle}`}>
            <Image
              src={n.actor.avatarUrl}
              alt=""
              width={42}
              height={42}
              className="h-11 w-11 rounded-full border border-plume-edge"
            />
          </Link>
          <div>
            <p className="text-[15px]">
              <span className="font-semibold">{n.actor.name}</span>{" "}
              <span className="text-plume-muted">{verb(n.type)}</span>
            </p>
            {n.post && (
              <Link
                href={`/post/${n.post.id}`}
                className="mt-1 block rounded-2xl border border-plume-edge bg-plume-bg/50 px-3 py-2 text-[13px] text-plume-muted line-clamp-2"
              >
                {n.post.body}
              </Link>
            )}
            <p className="mt-2 text-[12px] text-plume-muted">
              {formatDistanceToNowStrict(new Date(n.createdAt))} ago
            </p>
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="p-12 text-center text-plume-muted">No notifications.</p>
      )}
    </div>
  );
}

function verb(type: string) {
  switch (type) {
    case "LIKE":
      return "liked your plum";
    case "FOLLOW":
      return "followed you";
    case "REPLY":
      return "replied to you";
    case "REPOST":
      return "boosted your plum";
    case "QUOTE":
      return "quoted you";
    default:
      return "interacted";
  }
}
