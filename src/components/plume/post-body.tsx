"use client";

import Link from "next/link";

type Chunk =
  | { t: "text"; v: string }
  | { t: "url"; v: string }
  | { t: "mention"; v: string }
  | { t: "hash"; v: string };

export function splitPostBody(raw: string): Chunk[] {
  const re =
    /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]+|#[\p{L}\p{N}_]+)/gu;
  const out: Chunk[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last)
      out.push({ t: "text", v: raw.slice(last, m.index) });
    const tok = m[1]!;
    if (tok.startsWith("http"))
      out.push({ t: "url", v: tok });
    else if (tok.startsWith("@"))
      out.push({ t: "mention", v: tok.slice(1) });
    else out.push({ t: "hash", v: tok.slice(1).toLowerCase() });
    last = re.lastIndex;
  }
  if (last < raw.length) out.push({ t: "text", v: raw.slice(last) });
  return out;
}

export function PostBody({
  text,
  onHoverUser,
}: {
  text: string;
  onHoverUser?: (handle: string, el: HTMLElement) => void;
}) {
  const chunks = splitPostBody(text);
  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
      {chunks.map((c, i) => {
        if (c.t === "text") return <span key={i}>{c.v}</span>;
        if (c.t === "url")
          return (
            <a
              key={i}
              href={c.v}
              target="_blank"
              rel="noreferrer noopener"
              className="text-plume-accent hover:underline"
            >
              {c.v}
            </a>
          );
        if (c.t === "hash")
          return (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(`#${c.v}`)}`}
              className="text-plume-accent-2 hover:underline"
            >
              #{c.v}
            </Link>
          );
        return (
          <Link
            key={i}
            href={`/${c.v}`}
            className="text-plume-accent hover:underline font-medium"
            onMouseEnter={(e) =>
              onHoverUser?.(c.v, e.currentTarget as HTMLElement)
            }
          >
            @{c.v}
          </Link>
        );
      })}
    </p>
  );
}
