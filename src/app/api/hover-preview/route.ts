import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle") ?? "";

  const user = handle
    ? await prisma.user.findUnique({
        where: { handle },
        select: {
          id: true,
          handle: true,
          name: true,
          bio: true,
          avatarUrl: true,
          _count: { select: { followers: true } },
          createdAt: true,
          location: true,
        },
      })
    : null;

  let following = false;
  const viewer = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (user && viewer && viewer.id !== user.id) {
    const f = await prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: viewer.id,
          followeeId: user.id,
        },
      },
    });
    following = Boolean(f);
  }

  return NextResponse.json({ user, following });
}
