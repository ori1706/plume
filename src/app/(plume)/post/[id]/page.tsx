"use client";

import { use, useEffect, useState } from "react";
import { PostCard } from "@/components/plume/post-card";
import type { PostCardPayload } from "@/lib/post-include";

export default function PostThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <Thread id={id} />;
}

function Thread({ id }: { id: string }) {
  const [root, setRoot] = useState<PostCardPayload | null>(null);
  const [replies, setReplies] = useState<PostCardPayload[]>([]);
  const [engaged, setEngaged] = useState({
    liked: false,
    reposted: false,
    bookmarked: false,
  });
  const [replyMap, setReplyMap] = useState<
    Record<string, { liked: boolean; reposted: boolean; bookmarked: boolean }>
  >({});
  const [body, setBody] = useState("");

  async function load() {
    const tok = localStorage.getItem("plume_token");
    const r = await fetch(`/api/posts/${id}`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    const d = await r.json();
    setRoot(d.post);
    setReplies(d.replies ?? []);
    setEngaged(d.engaged ?? {});
    setReplyMap(d.replyEngagements ?? {});
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function reply() {
    const tok = localStorage.getItem("plume_token");
    await fetch(`/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      },
      body: JSON.stringify({ body, parentId: id }),
    });
    setBody("");
    void load();
  }

  if (!root)
    return <p className="p-12 text-center text-plume-muted">Opening thread…</p>;

  const rootPack = {
    kind: "post" as const,
    post: root,
    engaged,
  };

  return (
    <div className="min-h-[560px] pb-24">
      <PostCard item={rootPack} onUpdate={load} />
      <div className="border-t border-plume-edge px-4 py-3">
        <h2 className="text-sm uppercase text-plume-muted">
          Conversation · {replies.length} replies
        </h2>
      </div>
      {(replies ?? []).map((p) => (
        <PostCard
          key={p.id}
          item={{
            kind: "post",
            post: p,
            engaged:
              replyMap[p.id] ?? {
                liked: false,
                reposted: false,
                bookmarked: false,
              },
          }}
          onUpdate={load}
        />
      ))}

      <div className="sticky bottom-0 border-t border-plume-edge bg-plume-bg/90 p-4 backdrop-blur">
        <textarea
          value={body}
          rows={3}
          onChange={(e) =>
            setBody(e.target.value.slice(0, 280))
          }
          placeholder="Join the thread"
          className="w-full rounded-2xl border border-plume-edge bg-plume-panel/80 px-3 py-2 text-sm outline-none focus:border-plume-accent/35"
        />
        <div className="mt-3 flex justify-between text-xs text-plume-muted">
          <span>{280 - body.length} left</span>
          <button
            type="button"
            disabled={!body.trim()}
            onClick={() => void reply()}
            className="rounded-full bg-plume-accent px-4 py-2 text-[13px] font-semibold text-plume-bg hover:brightness-110 disabled:opacity-40"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
