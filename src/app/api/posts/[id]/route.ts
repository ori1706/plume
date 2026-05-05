import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { postCardInclude } from "@/lib/post-include";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const viewer = await getUserFromAuthHeader(req.headers.get("authorization"));
  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: postCardInclude,
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const directReplies = await prisma.post.findMany({
    where: { parentId: id },
    orderBy: { createdAt: "asc" },
    take: 40,
    include: postCardInclude,
  });

  const nested =
    directReplies.length > 0
      ? await prisma.post.findMany({
          where: {
            parentId: { in: directReplies.map((r) => r.id) },
          },
          orderBy: { createdAt: "asc" },
          take: 80,
          include: postCardInclude,
        })
      : [];

  const replies = [...directReplies, ...nested].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const ids = [post.id, ...replies.map((r) => r.id)];
  let engaged = {
    liked: false,
    reposted: false,
    bookmarked: false,
  };
  let replyEngagements: Record<
    string,
    { liked: boolean; reposted: boolean; bookmarked: boolean }
  > = {};

  if (viewer) {
    const [likes, reposts, bookmarks] = await Promise.all([
      prisma.like.findMany({
        where: { userId: viewer.id, postId: { in: ids } },
        select: { postId: true },
      }),
      prisma.repost.findMany({
        where: { userId: viewer.id, postId: { in: ids } },
        select: { postId: true },
      }),
      prisma.bookmark.findMany({
        where: { userId: viewer.id, postId: { in: ids } },
        select: { postId: true },
      }),
    ]);
    const l = new Set(likes.map((x) => x.postId));
    const r = new Set(reposts.map((x) => x.postId));
    const b = new Set(bookmarks.map((x) => x.postId));
    engaged = {
      liked: l.has(post.id),
      reposted: r.has(post.id),
      bookmarked: b.has(post.id),
    };
    replyEngagements = Object.fromEntries(
      replies.map((rep) => [
        rep.id,
        {
          liked: l.has(rep.id),
          reposted: r.has(rep.id),
          bookmarked: b.has(rep.id),
        },
      ]),
    );
  }

  return NextResponse.json({ post, replies, engaged, replyEngagements });
}
