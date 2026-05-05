"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostCard } from "@/components/plume/post-card";
import type { TimelineItem } from "@/components/plume/post-card";

type Tab = "for-you" | "trending" | "news";

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>("for-you");
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [news, setNews] = useState<
    { slug: string; title: string; excerpt: string; source: string; tone: string; accent: string }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const tok = localStorage.getItem("plume_token");
      const r = await fetch(`/api/explore?tab=${tab}`, {
        headers: tok ? { Authorization: `Bearer ${tok}` } : {},
      });
      const d = await r.json();
      setItems(d.items ?? []);
      setTags(d.tags ?? []);
      setNews(d.news ?? []);
    })();
  }, [tab]);

  return (
    <div className="min-h-[560px]">
      <div className="flex border-b border-plume-edge px-4">
        {(
          [
            ["for-you", "For you"],
            ["trending", "Trending"],
            ["news", "News"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 border-b-2 py-4 text-[14px] font-semibold ${
              tab === id
                ? "border-plume-accent text-plume-text"
                : "border-transparent text-plume-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "news" ? (
        <div className="grid gap-4 p-6">
          {news.map((n) => (
            <article
              key={n.slug}
              className="rounded-[22px] border border-plume-edge bg-plume-panel/70 p-5 shadow-lg"
              style={{ borderTopColor: n.accent, borderTopWidth: 3 }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-plume-muted mb-3">
                {n.source} · {n.tone}
              </p>
              <h3 className="font-display text-lg mb-3">{n.title}</h3>
              <p className="text-sm text-plume-muted">{n.excerpt}</p>
              <Link href="/search?q=newsroom" className="mt-4 inline-block text-sm text-plume-accent">
                Dive into chatter →
              </Link>
            </article>
          ))}
        </div>
      ) : tab === "trending" ? (
        <div className="divide-y divide-plume-edge px-6 py-4">
          <p className="text-sm text-plume-muted mb-4 hidden">
            Showing tags from seed data · explore posts any tag from search
          </p>
          <ul className="space-y-4">
            {tags.map((t, i) => (
              <li key={t.tag} className="flex gap-6">
                <span className="text-4xl font-bold text-plume-edge">{i + 1}</span>
                <Link href={`/search?q=${encodeURIComponent("#" + t.tag)}`}>
                  <div className="text-lg font-semibold text-plume-accent-2">
                    #{t.tag}
                  </div>
                  <div className="text-sm text-plume-muted">{t.count} plums</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          {(items ?? []).map((it) => (
            <PostCard key={it.post.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
