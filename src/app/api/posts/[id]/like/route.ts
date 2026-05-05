import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { notifyIfNeeded } from "@/lib/engagement";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: user.id, postId: id } },
  });
  if (!existing) {
    await prisma.like.create({
      data: { userId: user.id, postId: id },
    });
    await notifyIfNeeded({
      recipientId: post.authorId,
      actorId: user.id,
      type: "LIKE",
      postId: id,
    });
  }

  const count = await prisma.like.count({ where: { postId: id } });
  return NextResponse.json({ liked: true, count });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.like.deleteMany({
    where: { userId: user.id, postId: id },
  });
  const count = await prisma.like.count({ where: { postId: id } });
  return NextResponse.json({ liked: false, count });
}
