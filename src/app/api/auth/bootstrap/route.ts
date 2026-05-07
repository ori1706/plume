import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUserToken } from "@/lib/jwt";

/** Demo-only: issues a JWT for the seeded preview account (no password round-trip). */
export async function POST() {
  const user = await prisma.user.findUnique({
    where: { handle: "plume_preview" },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Database not seeded — run npm run db:seed" },
      { status: 500 },
    );
  }
  const token = await signUserToken(user.id);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      handle: user.handle,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    },
  });
}
