import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json(
      { suggestions: [], error: "no-session" },
      { status: 200 },
    );
  }

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  });
  const avoidIds = new Set([user.id, ...following.map((f) => f.followeeId)]);

  const candidates = await prisma.user.findMany({
    where: { id: { notIn: [...avoidIds] } },
    select: {
      id: true,
      handle: true,
      name: true,
      avatarUrl: true,
      bio: true,
    },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  return NextResponse.json({ suggestions: candidates });
}
