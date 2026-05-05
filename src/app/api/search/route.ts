import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { postCardInclude } from "@/lib/post-include";

async function engagementSets(viewerId: string | null, ids: string[]) {
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
  const q = (searchParams.get("q") ?? "").trim();
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));

  if (!q) {
    return NextResponse.json({ users: [], posts: [], tag: null });
  }

  const tagMatch = q.match(/^#([\p{L}\p{N}_]+)$/u);
  if (tagMatch) {
    const tag = tagMatch[1].toLowerCase();
    const hashtag = await prisma.hashtag.findUnique({ where: { tag } });
    if (!hashtag) {
      return NextResponse.json({ users: [], posts: [], tag });
    }
    const links = await prisma.postHashtag.findMany({
      where: { hashtagId: hashtag.id },
      select: { postId: true },
      take: 80,
    });
    const posts = await prisma.post.findMany({
      where: { id: { in: links.map((l) => l.postId) }, parentId: null },
      orderBy: { createdAt: "desc" },
      include: postCardInclude,
    });
    const eng = await engagementSets(user?.id ?? null, posts.map((p) => p.id));
    return NextResponse.json({
      users: [],
      tag,
      posts: posts.map((post) => ({
        post,
        engaged: {
          liked: eng.liked.has(post.id),
          reposted: eng.reposted.has(post.id),
          bookmarked: eng.bookmarked.has(post.id),
        },
      })),
    });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { handle: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      handle: true,
      name: true,
      avatarUrl: true,
      bio: true,
    },
    take: 12,
  });

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      body: { contains: q, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: postCardInclude,
  });
  const eng = await engagementSets(user?.id ?? null, posts.map((p) => p.id));

  return NextResponse.json({
    users,
    tag: null,
    posts: posts.map((post) => ({
      post,
      engaged: {
        liked: eng.liked.has(post.id),
        reposted: eng.reposted.has(post.id),
        bookmarked: eng.bookmarked.has(post.id),
      },
    })),
  });
}
