import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ users: [] });
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { handle: { startsWith: q, mode: "insensitive" } },
        { name: { startsWith: q, mode: "insensitive" } },
      ],
    },
    select: {
      handle: true,
      name: true,
      avatarUrl: true,
    },
    take: 8,
  });
  return NextResponse.json({ users });
}
