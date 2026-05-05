import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/jwt";

export async function getUserFromAuthHeader(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const id = await verifyUserToken(token);
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      handle: true,
      name: true,
      avatarUrl: true,
      bio: true,
    },
  });
}
