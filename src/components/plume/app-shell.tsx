"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavRail } from "@/components/plume/nav-rail";
import { ComposeModal } from "@/components/plume/compose-modal";
import { useSession } from "@/context/session-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const [composeOpen, setComposeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [quote, setQuote] = useState<{
    id: string;
    author: { handle: string; name: string; avatarUrl: string };
    body: string;
  } | null>(null);

  useEffect(() => {
    const onCompose = () => setComposeOpen(true);
    const onShortcuts = () => setShortcutsOpen(true);
    const onQuote = (e: Event) => {
      const ce = e as CustomEvent<{
        id: string;
        author: { handle: string; name: string; avatarUrl: string };
        body: string;
      }>;
      setQuote(ce.detail);
      setComposeOpen(true);
    };
    window.addEventListener("plume-compose-open", onCompose);
    window.addEventListener("plume-shortcuts-open", onShortcuts);
    window.addEventListener("plume-open-quote", onQuote);
    return () => {
      window.removeEventListener("plume-compose-open", onCompose);
      window.removeEventListener("plume-shortcuts-open", onShortcuts);
      window.removeEventListener("plume-open-quote", onQuote);
    };
  }, []);

  const refreshFeeds = useCallback(() => {
    router.refresh();
    window.dispatchEvent(new CustomEvent("plume-feed-refresh"));
  }, [router]);

  const [q, setQ] = useState("");

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-14 space-y-4 animate-pulse">
        <div className="h-8 w-44 rounded bg-plume-edge" />
        <div className="h-32 rounded-2xl bg-plume-panel/60" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] justify-center gap-2 px-3 sm:gap-4 sm:px-4 relative">
      <NavRail onComposeClick={() => setComposeOpen(true)} profileHref={user ? `/${user.handle}` : "/"} />
      <main className="min-w-0 w-full max-w-xl border-x border-plume-edge bg-plume-panel/30 min-h-full">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-plume-edge bg-plume-bg/80 px-3 py-2 backdrop-blur-md">
          <h1 className="font-display flex-1 truncate text-lg tracking-tight capitalize text-plume-text/90">
            {pathname === "/" ? "Home" : pathname.split("/").filter(Boolean)[0] ?? ""}
          </h1>
          <form
            className="flex flex-1 justify-end max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people or posts"
              className="w-full rounded-full border border-plume-edge bg-plume-bg/85 px-4 py-2 text-sm outline-none focus:border-plume-accent/50"
            />
          </form>
          <button
            type="button"
            onClick={() =>
              document.documentElement.classList.toggle("light")
            }
            className="hidden sm:inline rounded-full border border-plume-edge px-3 py-2 text-xs text-plume-muted hover:text-plume-text"
            title="Toggle theme"
          >
            Theme
          </button>
        </header>
        <div className="min-h-[560px]">{children}</div>
      </main>
      <aside className="hidden lg:block w-[min(300px,35%)] shrink-0 py-6 pl-1">
        <TrendingBlock />
        <WhoToFollowBlock />
      </aside>

      <ComposeModal
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setQuote(null);
        }}
        onPosted={refreshFeeds}
        quotedPost={quote}
      />

      {shortcutsOpen && (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}

function TrendingBlock() {
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  useEffect(() => {
    void fetch("/api/sidebar/trending")
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []));
  }, []);
  return (
    <section className="rounded-3xl border border-plume-edge bg-plume-panel/60 p-5">
      <h2 className="font-display mb-4 text-lg tracking-tight">
        Trending tags
      </h2>
      <ul className="space-y-3 text-sm">
        {tags.slice(0, 8).map((t) => (
          <li key={t.tag}>
            <Link
              href={`/search?q=${encodeURIComponent("#" + t.tag)}`}
              className="group flex justify-between"
            >
              <span className="font-medium text-plume-accent-2 group-hover:underline">
                #{t.tag}
              </span>
              <span className="text-plume-muted">{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WhoToFollowBlock() {
  const { authFetch } = useSession();
  const [list, setList] = useState<
    { handle: string; name: string; avatarUrl: string }[]
  >([]);
  useEffect(() => {
    void authFetch("/api/sidebar/suggestions")
      .then((r) => r.json())
      .then((d) => setList(d.suggestions ?? []));
  }, [authFetch]);
  return (
    <section className="mt-5 rounded-3xl border border-plume-edge bg-plume-panel/60 p-5">
      <h2 className="font-display mb-4 text-lg tracking-tight">
        Who to follow
      </h2>
      <ul className="space-y-4 text-sm">
        {list.slice(0, 5).map((u) => (
          <li key={u.handle} className="flex items-center justify-between gap-2">
            <Link href={`/${u.handle}`} className="min-w-0">
              <div className="font-medium truncate">{u.name}</div>
              <div className="text-plume-muted truncate text-xs">@{u.handle}</div>
            </Link>
            <FollowQuick handle={u.handle} onChange={() => routerRefresh()} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function routerRefresh() {
  if (typeof window !== "undefined") window.location.reload();
}

function FollowQuick({
  handle,
  onChange,
}: {
  handle: string;
  onChange: () => void;
}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("plume_token")
      : null;
  async function follow() {
    await fetch(`/api/users/${handle}/follow`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    onChange();
  }
  return (
    <button
      type="button"
      onClick={() => void follow()}
      className="shrink-0 rounded-full border border-plume-edge px-3 py-1 text-xs font-semibold hover:bg-plume-edge/80"
    >
      Follow
    </button>
  );
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-[900] bg-black/70 p-6 backdrop-blur-sm flex items-start justify-center"
      onMouseDown={(e) =>
        e.target === e.currentTarget ? onClose() : undefined
      }
    >
      <div className="mt-24 w-full max-w-md rounded-3xl border border-plume-edge bg-plume-panel p-6 shadow-2xl">
        <h2 className="font-display mb-4 text-xl">Keyboard</h2>
        <ul className="space-y-2 text-sm text-plume-muted">
          <li className="flex items-center gap-2">
            <kbd className="rounded-md border border-plume-edge bg-plume-bg px-2 py-0.5 font-mono text-[11px] text-plume-text">
              n
            </kbd>
            New draft
          </li>
          <li className="flex items-center gap-2">
            <kbd className="rounded-md border border-plume-edge bg-plume-bg px-2 py-0.5 font-mono text-[11px] text-plume-text">
              ?
            </kbd>
            This cheatsheet
          </li>
          <li className="flex items-center gap-2">
            <kbd className="rounded-md border border-plume-edge bg-plume-bg px-2 py-0.5 font-mono text-[11px] text-plume-text">
              j
            </kbd>
            /
            <kbd className="rounded-md border border-plume-edge bg-plume-bg px-2 py-0.5 font-mono text-[11px] text-plume-text">
              k
            </kbd>
            Move between posts when focused
          </li>
        </ul>
        <button type="button" className="mt-6 underline" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
