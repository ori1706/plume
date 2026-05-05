"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const MAX = 280;

export function ComposeModal({
  open,
  onClose,
  onPosted,
  quotedPost,
  replyToId,
}: {
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
  quotedPost?: {
    id: string;
    body: string;
    author: { handle: string; name: string; avatarUrl: string };
  } | null;
  replyToId?: string | null;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [suggest, setSuggest] = useState<
    { tags?: { tag: string }[]; users?: { handle: string; name: string }[] }
  >({});
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setText("");
      setImages([]);
      setSuggest({});
    }
  }, [open]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("plume_token")
      : null;

  async function typeahead() {
    const el = ta.current;
    if (!el) return;
    const v = el.value;
    const car = el.selectionStart ?? v.length;
    const before = v.slice(0, car);
    const mh = before.match(/@([a-zA-Z0-9_]*)$/);
    const hh = before.match(/#([a-zA-Z0-9_]*)$/);
    if (mh) {
      const r = await fetch(
        `/api/typeahead/users?q=${encodeURIComponent(mh[1])}`,
      );
      const d = await r.json();
      setSuggest({ users: d.users });
      return;
    }
    if (hh) {
      const r = await fetch(
        `/api/typeahead/hashtags?q=${encodeURIComponent(hh[1])}`,
      );
      const d = await r.json();
      setSuggest({ tags: d.tags });
      return;
    }
    setSuggest({});
  }

  const onChange = (v: string) => {
    setText(v);
    void typeahead();
  };

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: string[] = [...images];
      for (let i = 0; i < files.length && next.length < 4; i++) {
        const f = files[i];
        if (!f.type.startsWith("image/")) continue;
        next.push(await fileToDataURL(f));
    }
    setImages(next.slice(0, 4));
  }

  async function submit() {
    const bodyTrim = text.trim();
    if (bodyTrim.length > MAX) return;
    if (!quotedPost && !replyToId && bodyTrim.length === 0) return;
    if (replyToId && bodyTrim.length === 0) return;

    await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        body: bodyTrim,
        quotedPostId: quotedPost?.id,
        parentId: replyToId,
        images: images.map((url) => ({
          url,
          width: 900,
          height: 700,
        })),
      }),
    });

    onPosted();
    onClose();
  }

  const left = MAX - text.length;
  const progress = Math.min(1, text.length / MAX);

  useEffect(() => {
    function onEvt() {
      if (ta.current && open) ta.current.focus();
    }
    window.addEventListener("plume-compose-open", onEvt);
    return () => window.removeEventListener("plume-compose-open", onEvt);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/65 p-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-plume-edge bg-plume-panel p-5 shadow-2xl"
        role="dialog"
        aria-modal
      >
        <div className="mb-3 flex justify-between gap-4">
          <button
            type="button"
            className="text-plume-muted hover:text-plume-text"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            disabled={
              left < 0 ||
              (replyToId
                ? text.trim().length === 0
                : !quotedPost && text.trim().length === 0)
            }
            onClick={() => void submit()}
            className="rounded-full bg-plume-accent px-4 py-2 text-[14px] font-semibold text-plume-bg hover:brightness-110 disabled:opacity-40"
          >
            Post
          </button>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-plume-edge" />
          <div className="flex-1 min-w-0">
            {quotedPost && (
              <div className="mb-3 rounded-2xl border border-plume-edge bg-plume-bg/55 p-3 text-sm text-plume-muted">
                <span className="font-medium text-plume-text">
                  @{quotedPost.author.handle}
                </span>
                : {quotedPost.body.slice(0, 160)}
              </div>
            )}
            <textarea
              ref={ta}
              placeholder={
                quotedPost
                  ? "Add commentary…"
                  : replyToId
                    ? "Post your reply"
                    : "What is flowing today?"
              }
              rows={6}
              className="w-full resize-none rounded-2xl border border-transparent bg-plume-bg/65 px-3 py-3 text-[16px] text-plume-text outline-none placeholder:text-plume-muted/70 focus:border-plume-accent/40"
              value={text}
              onChange={(e) =>
                onChange(
                  MAX + 80 < e.target.value.length
                    ? text
                    : e.target.value.slice(0, MAX + 50),
                )
              }
            />
            {(suggest.tags?.length || suggest.users?.length) && (
              <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-plume-edge bg-plume-bg/85 text-sm">
                {suggest.tags?.map((t) => (
                  <li key={t.tag}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-plume-edge/80"
                      onClick={() =>
                        injectToken(ta, text, `#${t.tag}`, setText)
                      }
                    >
                      #{t.tag}
                    </button>
                  </li>
                ))}
                {suggest.users?.map((u) => (
                  <li key={u.handle}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-plume-edge/80"
                      onClick={() =>
                        injectToken(ta, text, `@${u.handle} `, setText)
                      }
                    >
                      @{u.handle}
                      <span className="text-plume-muted">{u.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="text-plume-accent hover:text-plume-text"
                onClick={() => fileRef.current?.click()}
              >
                Add images ({images.length}/4)
              </button>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  void addFiles(e.target.files)
                }
              />
              <CharRing left={left} progress={progress} />
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-1">
                {images.map((u) => (
                  <div key={u} className="relative aspect-square overflow-hidden rounded-lg bg-plume-edge">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function fileToDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(f);
  });
}

function injectToken(
  ta: RefObject<HTMLTextAreaElement | null>,
  prev: string,
  token: string,
  setText: (s: string) => void,
) {
  const el = ta.current;
  if (!el) return;
  const car = el.selectionStart ?? prev.length;
  const before = prev.slice(0, car);
  const after = prev.slice(car);
  const repl = before.replace(/@([a-zA-Z0-9_]*)$/u, "").replace(/#([a-zA-Z0-9_]*)$/u, "");
  const next = repl + token + after;
  setText(next.slice(0, MAX + 10));
}

function CharRing({ left, progress }: { left: number; progress: number }) {
  const ok = left >= 0;
  const r = 18;
  const c = 2 * Math.PI * r * (ok ? progress : 1);
  return (
    <div className="relative ml-auto flex items-center gap-2 text-[12px] text-plume-muted">
      <svg width={44} height={44}>
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke="rgba(148,163,184,0.35)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke={
            ok
              ? left < 21
                ? "rgb(251 113 133)"
                : "rgb(62 224 179)"
              : "rgb(251 113 133)"
          }
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${c} ${999}`}
          transform="rotate(-90 22 22)"
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-mono ${!ok ? "text-plume-danger" : ""}`}>
        {left}
      </span>
    </div>
  );
}
