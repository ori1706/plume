import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { postCardInclude, type PostCardPayload } from "@/lib/post-include";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  const { handle } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "posts";
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));

  const profile = await prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      name: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      location: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let following = false;
  if (user && user.id !== profile.id) {
    const f = await prisma.follow.findUnique({
      where: {
        followerId_followeeId: { followerId: user.id, followeeId: profile.id },
      },
    });
    following = Boolean(f);
  }

  let posts: PostCardPayload[];
  if (tab === "replies") {
    posts = await prisma.post.findMany({
      where: { authorId: profile.id, parentId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: postCardInclude,
    });
  } else if (tab === "media") {
    posts = await prisma.post.findMany({
      where: { authorId: profile.id, parentId: null, media: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: postCardInclude,
    });
  } else if (tab === "likes") {
    if (user?.id !== profile.id) {
      posts = [];
    } else {
      posts = await prisma.post.findMany({
        where: {
          parentId: null,
          likes: { some: { userId: profile.id } },
        },
        orderBy: { createdAt: "desc" },
        take: 60,
        include: postCardInclude,
      });
    }
  } else {
    posts = await prisma.post.findMany({
      where: { authorId: profile.id, parentId: null },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: postCardInclude,
    });
  }

  const ids = posts.map((p) => p.id);
  const [likesRows, repostRows, markRows] =
    user && ids.length
    ? await Promise.all([
        prisma.like.findMany({
          where: { userId: user.id, postId: { in: ids } },
          select: { postId: true },
        }),
        prisma.repost.findMany({
          where: { userId: user.id, postId: { in: ids } },
          select: { postId: true },
        }),
        prisma.bookmark.findMany({
          where: { userId: user.id, postId: { in: ids } },
          select: { postId: true },
        }),
      ])
    : [[], [], []];
  const liked = new Set(likesRows.map((e) => e.postId));
  const repostedSet = new Set(repostRows.map((r) => r.postId));
  const bookmarkSet = new Set(markRows.map((b) => b.postId));

  const items = posts.map((post) => ({
    post,
    engaged: {
      liked: liked.has(post.id),
      reposted: repostedSet.has(post.id),
      bookmarked: bookmarkSet.has(post.id),
    },
  }));

  return NextResponse.json({ profile, following, tab, items });
}
