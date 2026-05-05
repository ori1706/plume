import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";
import { notifyIfNeeded } from "@/lib/engagement";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { handle } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { handle } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "noop" }, { status: 400 });
  }
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followeeId: {
        followerId: user.id,
        followeeId: target.id,
      },
    },
  });
  if (!existing) {
    await prisma.follow.create({
      data: { followerId: user.id, followeeId: target.id },
    });
    await notifyIfNeeded({
      recipientId: target.id,
      actorId: user.id,
      type: "FOLLOW",
    });
  }
  const counts = await prisma.user.findUnique({
    where: { id: target.id },
    select: {
      _count: { select: { followers: true, following: true } },
    },
  });
  return NextResponse.json({ following: true, counts: counts?._count });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { handle } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { handle } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.follow.deleteMany({
    where: { followerId: user.id, followeeId: target.id },
  });
  const counts = await prisma.user.findUnique({
    where: { id: target.id },
    select: {
      _count: { select: { followers: true, following: true } },
    },
  });
  return NextResponse.json({ following: false, counts: counts?._count });
}
