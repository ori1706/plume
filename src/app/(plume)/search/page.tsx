"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PostCard } from "@/components/plume/post-card";
import type { PostCardPayload } from "@/lib/post-include";

type Pack = {
  post: PostCardPayload;
  engaged: { liked: boolean; reposted: boolean; bookmarked: boolean };
};

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [users, setUsers] = useState<
    { id: string; handle: string; name: string; avatarUrl: string; bio?: string }[]
  >([]);
  const [posts, setPosts] = useState<Pack[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    setBusy(true);
    const tok = localStorage.getItem("plume_token");
    void fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setPosts(d.posts ?? []);
      })
      .finally(() => setBusy(false));
  }, [q]);

  return (
    <div className="min-h-[560px] space-y-6 p-4">
      {!q.trim() ? (
        <p className="text-plume-muted">
          Try{" "}
          <Link href="/search?q=%23designsystems" className="text-plume-accent">
            #designsystems
          </Link>
          {" "}
          or{" "}
          <Link href="/search?q=mira" className="text-plume-accent">
            mira
          </Link>
          .
        </p>
      ) : busy ? (
        <p className="text-plume-muted">Searching…</p>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm uppercase text-plume-muted">People</h2>
            <ul className="space-y-4">
              {users.map((u) => (
                <li key={u.id} className="flex gap-3">
                  <Image
                    src={u.avatarUrl}
                    alt=""
                    width={52}
                    height={52}
                    className="h-[52px] w-[52px] rounded-full border border-plume-edge"
                  />
                  <Link href={`/${u.handle}`} className="min-w-0">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-plume-muted">@{u.handle}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-plume-muted">
                      {u.bio}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm uppercase text-plume-muted">Posts</h2>
            {(posts ?? []).map((pack) => (
              <PostCard
                key={pack.post.id}
                item={{
                  kind: "post",
                  post: pack.post,
                  engaged: pack.engaged,
                }}
              />
            ))}
          </section>

          {(users ?? []).length + (posts ?? []).length === 0 ? (
            <p className="text-plume-muted">No matches.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
