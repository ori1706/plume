import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.hashtag.findMany({
    orderBy: { count: "desc" },
    take: 10,
    select: { tag: true, count: true },
  });
  return NextResponse.json({ tags });
}
