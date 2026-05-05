import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json({ tags: [] });
  const tags = await prisma.hashtag.findMany({
    where: { tag: { startsWith: q } },
    orderBy: { count: "desc" },
    take: 8,
    select: { tag: true, count: true },
  });
  return NextResponse.json({ tags });
}
