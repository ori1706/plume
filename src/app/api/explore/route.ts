import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { postCardInclude } from "@/lib/post-include";

const NEWS_ITEMS = [
  {
    slug: "field-notes",
    title: "Climate tech quietly crossed an inflection point",
    excerpt:
      "New grid-scale installs are outpacing forecasts in three continents — here's what founders are tracking.",
    source: "Plume Signals",
    tone: "Emerging",
    accent: "#14b8a6",
  },
  {
    slug: "indie-week",
    title: "Bootstrappers are shipping slower — and charging more",
    excerpt:
      "A survey of 1,200 indie products shows deliberate release cadences and sharper positioning.",
    source: "Indie Ledger",
    tone: "Product",
    accent: "#f97316",
  },
  {
    slug: "city-labs",
    title: "Cities pilot shared sensor networks for quieter streets",
    excerpt:
      "Noise maps are becoming municipal infrastructure, not weekend experiments.",
    source: "Urban Thread",
    tone: "Civic",
    accent: "#6366f1",
  },
];

async function annotateEngagement(viewerId: string | null, posts: { id: string }[]) {
  const ids = posts.map((p) => p.id);
  if (!viewerId || !ids.length) {
    return {
      liked: new Set<string>(),
      reposted: new Set<string>(),
      bookmarked: new Set<string>(),
    };
  }
  const [likes, reposts, bookmarks] = await Promise.all([
    prisma.like.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
    prisma.repost.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
    prisma.bookmark.findMany({
      where: { userId: viewerId, postId: { in: ids } },
      select: { postId: true },
    }),
  ]);
  return {
    liked: new Set(likes.map((l) => l.postId)),
    reposted: new Set(reposts.map((r) => r.postId)),
    bookmarked: new Set(bookmarks.map((b) => b.postId)),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "for-you";
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));

  if (tab === "trending") {
    const tags = await prisma.hashtag.findMany({
      orderBy: { count: "desc" },
      take: 18,
    });
    return NextResponse.json({ tab, tags, news: null, items: null });
  }

  if (tab === "news") {
    return NextResponse.json({ tab, tags: null, news: NEWS_ITEMS, items: null });
  }

  const posts = await prisma.post.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: postCardInclude,
  });

  posts.sort(
    (a, b) =>
      b._count.likes +
      b._count.reposts -
      (a._count.likes + a._count.reposts),
  );

  const top = posts.slice(0, 45);
  const engagement = await annotateEngagement(user?.id ?? null, top);
  const stripped = top;

  const items = stripped.map((post) => ({
    kind: "post" as const,
    post,
    engaged: {
      liked: engagement.liked.has(post.id),
      reposted: engagement.reposted.has(post.id),
      bookmarked: engagement.bookmarked.has(post.id),
    },
  }));

  return NextResponse.json({ tab, tags: null, news: null, items });
}
