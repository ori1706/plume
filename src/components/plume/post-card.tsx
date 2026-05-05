"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import Image from "next/image";
import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { PostBody } from "@/components/plume/post-body";
import type { PostCardPayload } from "@/lib/post-include";

export type TimelineItem =
  | {
      kind: "post";
      post: PostCardPayload;
      engaged: { liked: boolean; reposted: boolean; bookmarked: boolean };
    }
  | {
      kind: "repost";
      repostBy: { handle: string; name: string; avatarUrl: string };
      post: PostCardPayload;
      engaged: { liked: boolean; reposted: boolean; bookmarked: boolean };
    };

export function PostCard({
  item,
  onUpdate,
}: {
  item: TimelineItem;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const post = item.post;
  const [hoverMention, setHoverMention] = useState<{
    handle: string;
    el: HTMLElement;
  } | null>(null);
  const [likeLocal, setLikeLocal] = useState({
    on: item.engaged.liked,
    count: post._count.likes,
    burst: false,
  });
  const [repoLocal, setRepoLocal] = useState({
    on: item.engaged.reposted,
    count: post._count.reposts,
    anim: false,
  });
  const [bmLocal, setBmLocal] = useState(item.engaged.bookmarked);

  const time = useMemo(
    () => formatDistanceToNowStrict(new Date(post.createdAt)),
    [post.createdAt],
  );

  async function toggleLike() {
    const prev = likeLocal.on;
    setLikeLocal({
      on: !prev,
      count: likeLocal.count + (prev ? -1 : 1),
      burst: !prev,
    });
    const method = prev ? "DELETE" : "POST";
    const token = localStorage.getItem("plume_token");
    await fetch(`/api/posts/${post.id}/like`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    onUpdate?.();
  }

  async function toggleRepo() {
    const prev = repoLocal.on;
    setRepoLocal({
      on: !prev,
      count: repoLocal.count + (prev ? -1 : 1),
      anim: true,
    });
    setTimeout(() =>
      setRepoLocal((x) => ({ ...x, anim: false })),
    540,
    );
    const method = prev ? "DELETE" : "POST";
    const token = localStorage.getItem("plume_token");
    await fetch(`/api/posts/${post.id}/repost`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    onUpdate?.();
  }

  async function toggleBm() {
    const next = !bmLocal;
    setBmLocal(next);
    const method = next ? "POST" : "DELETE";
    const token = localStorage.getItem("plume_token");
    await fetch(`/api/posts/${post.id}/bookmark`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    onUpdate?.();
  }

  function copyShare() {
    void navigator.clipboard?.writeText(
      `${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`,
    );
  }

  return (
    <article
      className="group border-b border-plume-edge px-4 py-3 hover:bg-plume-panel/55 transition-colors"
      data-post-row
      tabIndex={0}
    >
      {item.kind === "repost" && (
        <p className="mb-2 pl-12 text-xs text-plume-muted flex items-center gap-2">
          <span
            aria-hidden
            className={`text-plume-muted ${repoLocal.anim ? "plume-repost-anim inline-block" : "inline-block"}`}
          >
            ↻
          </span>
          <button
            type="button"
            onClick={() => router.push(`/${item.repostBy.handle}`)}
            className="hover:text-plume-accent"
          >
            <span className="font-semibold">{item.repostBy.name}</span>
            {" "}
            reposted
          </button>
        </p>
      )}
      <div className="flex gap-3">
        <Link href={`/${post.author.handle}`}>
          <Image
            src={post.author.avatarUrl || "/avatar.svg"}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full border border-plume-edge"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2 justify-between gap-y-1">
            <div className="flex items-baseline gap-2 truncate">
              <Link
                href={`/${post.author.handle}`}
                className="font-semibold truncate hover:underline decoration-plume-accent/40"
              >
                {post.author.name}
              </Link>
              <span className="text-plume-muted truncate text-[14px]">
                @{post.author.handle}
              </span>
              <span className="text-plume-muted text-sm">· {time}</span>
            </div>
            <details className="relative ml-1">
              <summary className="list-none cursor-pointer rounded-full px-2 text-plume-muted opacity-70 hover:bg-plume-edge/70 [&::-webkit-details-marker]:hidden">
                ···
              </summary>
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-plume-edge bg-plume-panel p-2 shadow-2xl z-50">
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-plume-edge/75"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("plume-open-quote", {
                        detail: {
                          id: post.id,
                          author: post.author,
                          body: post.body,
                        },
                      }),
                    )
                  }
                >
                  Quote post
                </button>
              </div>
            </details>
          </div>
          <div className="mt-2 space-y-2">
            <PostBody
              text={post.body}
              onHoverUser={(handle, el) =>
                setHoverMention({ handle, el })
              }
            />
            {post.media.length > 0 && (
              <MediaGrid urls={post.media.map((m) => m.url)} />
            )}
            {post.quotedPost && (
              <button
                type="button"
                onClick={() => router.push(`/post/${post.quotedPost!.id}`)}
                className="w-full rounded-2xl border border-plume-edge bg-plume-bg/55 p-3 text-left hover:border-plume-accent/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Image
                    src={post.quotedPost.author.avatarUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-sm font-medium">
                    {post.quotedPost.author.name}
                  </span>
                  <span className="text-xs text-plume-muted">
                    @{post.quotedPost.author.handle}
                  </span>
                </div>
                <p className="text-sm text-plume-muted line-clamp-3 whitespace-pre-wrap">
                  {post.quotedPost.body}
                </p>
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-5 max-w-lg text-[13px] text-plume-muted">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 hover:text-plume-accent"
            >
              <span aria-hidden className="-mt-px">◎</span>
              {post._count.replies}
            </Link>
            <motion.button
              type="button"
              onClick={toggleRepo}
              className="flex items-center gap-2 hover:text-plume-accent-2 disabled:opacity-40"
              whileTap={{ scale: 0.92 }}
              aria-label="Repost"
            >
              <span className={repoLocal.anim ? "plume-repost-anim inline-block" : "inline-block"}>
                🔁
              </span>
              {repoLocal.count}
            </motion.button>
            <motion.button
              type="button"
              onClick={toggleLike}
              className={`relative flex items-center gap-2 hover:text-plume-danger ${
                likeLocal.on ? "text-plume-danger" : ""
              }`}
              whileTap={{ scale: 0.9 }}
              aria-label={`Like (${likeLocal.count})`}
            >
              <span className={`relative inline-block ${likeLocal.burst ? "plume-heart-burst" : ""}`}>
                ♥︎
              </span>
              <span suppressHydrationWarning>{likeLocal.count}</span>
            </motion.button>
            <motion.button
              type="button"
              aria-label="Bookmark"
              whileTap={{ scale: 0.9 }}
              onClick={toggleBm}
              className={`hover:text-plume-accent ${
                bmLocal ? "text-plume-accent" : ""
              }`}
            >
              ⌖
            </motion.button>
            <button
              type="button"
              onClick={copyShare}
              className="justify-self-end hover:text-plume-accent"
              aria-label="Copy link"
            >
              ⧉
            </button>
          </div>
          {hoverMention && (
            <div className="relative">
              <MentionFloater
                anchor={hoverMention.el}
                handle={hoverMention.handle}
                onLeave={() => setHoverMention(null)}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MentionFloater({
  handle,
  anchor,
  onLeave,
}: {
  handle: string;
  anchor: HTMLElement;
  onLeave: () => void;
}) {
  const [mini, setMini] = useState<{
    name: string;
    bio: string;
    followers: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/hover-preview?handle=${encodeURIComponent(handle)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.user) return;
        setMini({
          name: d.user.name as string,
          bio: ((d.user.bio as string) ?? "").slice(0, 140),
          followers: d.user._count?.followers ?? 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const style: CSSProperties = {
    position: "fixed",
    top: rect.bottom + 8,
    left: Math.min(
      rect.left - 96,
      (typeof window !== "undefined" ? window.innerWidth : 800) - 280 - 16,
    ),
  };

  return (
    <div
      className="pointer-events-auto absolute z-[60] w-[min(280px,96%)] rounded-2xl border border-plume-edge bg-plume-panel/95 p-3 text-[13px] shadow-2xl"
      style={style}
      onMouseLeave={onLeave}
    >
      {mini ? (
        <>
          <p className="font-semibold">{mini.name}</p>
          <p className="text-plume-muted mb-2">@{handle}</p>
          <p className="text-[12px] text-plume-text/85 line-clamp-2">{mini.bio}</p>
          <p className="text-xs text-plume-muted mt-2">{mini.followers} followers</p>
        </>
      ) : (
        <p className="text-plume-muted">…</p>
      )}
    </div>
  );
}

function MediaGrid({ urls }: { urls: string[] }) {
  const n = urls.length;
  const layout =
    n === 1
      ? "grid-cols-1"
      : n === 2
        ? "grid-cols-2"
        : n === 3
          ? "grid-cols-2"
          : "grid-cols-2";
  return (
    <div className={`grid gap-1 overflow-hidden rounded-2xl ${layout}`}>
      {urls.slice(0, 4).map((u, i) => (
        <div key={u + i} className={`relative bg-plume-edge ${n === 3 && i === 0 ? "col-span-2 h-52" : "h-40"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={u}
            alt=""
            className="h-full w-full object-cover hover:brightness-105 transition-[filter]"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
