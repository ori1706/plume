import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { authorMini, postCardInclude } from "@/lib/post-include";

async function annotateEngagement(viewerId: string, posts: { id: string }[]) {
  const ids = posts.map((p) => p.id);
  if (!ids.length) {
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
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  });
  const poolIds = [user.id, ...following.map((f) => f.followeeId)];
  const take = 50;

  const [rawPosts, rawReposts] = await Promise.all([
    prisma.post.findMany({
      where: {
        parentId: null,
        authorId: { in: poolIds },
      },
      orderBy: { createdAt: "desc" },
      take,
      include: postCardInclude,
    }),
    prisma.repost.findMany({
      where: {
        userId: { in: poolIds },
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: authorMini },
        post: {
          include: postCardInclude,
        },
      },
    }),
  ]);

  type Merged =
    | { kind: "post"; at: Date; post: (typeof rawPosts)[0] }
    | {
        kind: "repost";
        at: Date;
        by: (typeof rawReposts)[0]["user"];
        post: (typeof rawReposts)[0]["post"];
      };

  const merged: Merged[] = [
    ...rawPosts.map((post) => ({ kind: "post" as const, at: post.createdAt, post })),
    ...rawReposts
      .filter((r) => r.post.parentId === null)
      .map((r) => ({
        kind: "repost" as const,
        at: r.createdAt,
        by: r.user,
        post: r.post,
      })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const flattenedPosts = merged.map((m) => m.post);
  const engagement = await annotateEngagement(user.id, flattenedPosts);

  const items = merged.map((m) => ({
    kind: m.kind,
    ...(m.kind === "repost" ? { repostBy: m.by } : {}),
    post: m.post,
    engaged: {
      liked: engagement.liked.has(m.post.id),
      reposted: engagement.reposted.has(m.post.id),
      bookmarked: engagement.bookmarked.has(m.post.id),
    },
  }));

  return NextResponse.json({ items });
}
