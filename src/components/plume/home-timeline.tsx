"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/plume/post-card";
import type { TimelineItem } from "@/components/plume/post-card";
import { useSession } from "@/context/session-context";

export function HomeTimeline() {
  const { authFetch } = useSession();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [pill, setPill] = useState(0);
  const [since, setSince] = useState<string | null>(null);

  async function load() {
    const r = await authFetch("/api/feed/home");
    const data = await r.json();
    setItems(data.items ?? []);
    setSince(new Date().toISOString());
    setPill(0);
  }

  useEffect(() => {
    void load();
  }, [authFetch]);

  useEffect(() => {
    const id = window.setInterval(async () => {
      if (!since) return;
      const tok = localStorage.getItem("plume_token");
      const r = await fetch(
        `/api/feed/poll?since=${encodeURIComponent(since)}`,
        {
          headers: tok ? { Authorization: `Bearer ${tok}` } : undefined,
        },
      );
      const d = await r.json();
      setPill(d.newCount ?? 0);
    }, 28000);
    return () => clearInterval(id);
  }, [since]);

  useEffect(() => {
    const h = () => void load();
    window.addEventListener("plume-feed-refresh", h);
    return () => window.removeEventListener("plume-feed-refresh", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh uses latest closure
  }, []);

  useEffect(() => {
    const rows = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-post-row]"),
      );

    function onKey(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "j" || e.key === "k") {
        const list = rows();
        if (!list.length) return;
        const ae = document.activeElement as HTMLElement | null;
        let idx = ae ? list.indexOf(ae) : -1;
        if (idx < 0) idx = list.findIndex((el) => el.contains(ae!));
        if (idx < 0) idx = 0;
        const nextIdx =
          e.key === "j"
            ? Math.min(idx + 1, list.length - 1)
            : Math.max(idx - 1, 0);
        list[nextIdx]?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pb-24">
      {pill > 0 && (
        <button
          type="button"
          className="sticky top-[52px] z-30 mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-plume-accent/40 bg-plume-panel px-5 py-2 text-sm shadow-lg hover:bg-plume-edge/70"
          onClick={() => void load()}
        >
          {pill} new posts · show
        </button>
      )}
      <div className="border-b border-plume-edge p-4">
        <button
          type="button"
          className="w-full rounded-3xl border border-dashed border-plume-edge px-5 py-4 text-left text-plume-muted hover:border-plume-accent/40 hover:text-plume-text"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("plume-compose-open"))
          }
        >
          Start a plum… <span className="text-[11px]">(shortcut n)</span>
        </button>
      </div>

      <div>
        {items.map((it) => (
          <PostCard key={`${it.kind}-${it.post.id}`} item={it} onUpdate={load} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="p-12 text-center text-plume-muted">
          Loading your timeline…
        </p>
      )}
    </div>
  );
}
