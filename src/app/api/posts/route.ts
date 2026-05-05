import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { postCardInclude } from "@/lib/post-include";
import { attachHashtagsToPost } from "@/lib/hashtags";
import { notifyIfNeeded } from "@/lib/engagement";

const MAX_CHARS = 280;
const MAX_IMAGES = 4;

export async function POST(req: Request) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const text = typeof body.body === "string" ? body.body : "";
  const parentId =
    typeof body.parentId === "string" ? body.parentId : undefined;
  const quotedPostId =
    typeof body.quotedPostId === "string" ? body.quotedPostId : undefined;
  const images: { url: string; width?: number; height?: number }[] =
    Array.isArray(body.images) ? body.images : [];

  if (text.trim().length === 0 && !quotedPostId) {
    return NextResponse.json({ error: "Empty post" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: "Too long" }, { status: 400 });
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json({ error: "Too many images" }, { status: 400 });
  }

  const created = await prisma.post.create({
    data: {
      authorId: user.id,
      body: text.trim(),
      parentId: parentId ?? null,
      quotedPostId: quotedPostId ?? null,
      media:
        images.length > 0
          ? {
              create: images.slice(0, MAX_IMAGES).map((img, idx) => ({
                url: img.url,
                width: img.width ?? null,
                height: img.height ?? null,
                sortOrder: idx,
              })),
            }
          : undefined,
    },
    include: postCardInclude,
  });

  await attachHashtagsToPost(created.id, created.body);

  if (quotedPostId && !parentId) {
    const qp = await prisma.post.findUnique({ where: { id: quotedPostId } });
    if (qp && qp.authorId !== user.id) {
      await notifyIfNeeded({
        recipientId: qp.authorId,
        actorId: user.id,
        type: "QUOTE",
        postId: created.id,
      });
    }
  }

  if (parentId) {
    const parentPost = await prisma.post.findUnique({ where: { id: parentId } });
    if (parentPost) {
      await notifyIfNeeded({
        recipientId: parentPost.authorId,
        actorId: user.id,
        type: "REPLY",
        postId: created.id,
      });
    }
  }

  return NextResponse.json({ post: created });
}
