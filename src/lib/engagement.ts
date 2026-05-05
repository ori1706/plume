import { prisma } from "@/lib/prisma";

type Nt = "LIKE" | "FOLLOW" | "REPLY" | "REPOST" | "QUOTE";

export async function notifyIfNeeded(args: {
  recipientId: string;
  actorId: string;
  type: Nt;
  postId?: string;
}) {
  if (args.recipientId === args.actorId) return;
  await prisma.notification.create({
    data: {
      userId: args.recipientId,
      actorId: args.actorId,
      type: args.type,
      postId: args.postId,
    },
  });
}
