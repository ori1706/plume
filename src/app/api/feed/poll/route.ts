import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromAuthHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ newCount: 0 });
  }
  const sinceParam = new URL(req.url).searchParams.get("since");
  const since =
    sinceParam && !Number.isNaN(Date.parse(sinceParam))
      ? new Date(sinceParam)
      : null;
  if (!since) return NextResponse.json({ newCount: 0 });

  const pool = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  });
  const ids = new Set<string>([user.id, ...pool.map((p) => p.followeeId)]);

  const newCount = await prisma.post.count({
    where: {
      parentId: null,
      createdAt: { gt: since },
      authorId: { in: [...ids] },
    },
  });

  return NextResponse.json({ newCount });
}
