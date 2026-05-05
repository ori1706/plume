import type { Prisma } from "@prisma/client";

export const authorMini = {
  id: true,
  handle: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const postCardInclude = {
  author: { select: authorMini },
  quotedPost: {
    include: {
      author: { select: authorMini },
      media: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  media: { orderBy: { sortOrder: "asc" as const } },
  _count: { select: { likes: true, reposts: true, replies: true } },
} satisfies Prisma.PostInclude;

export type PostCardPayload = Prisma.PostGetPayload<{
  include: typeof postCardInclude;
}>;
