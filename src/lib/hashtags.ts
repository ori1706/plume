import { prisma } from "@/lib/prisma";

const TAG_RE = /#([\p{L}\p{N}_]+)/gu;

export function extractHashtags(body: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, TAG_RE.flags);
  while ((m = re.exec(body)) !== null) {
    out.push(m[1].toLowerCase());
  }
  return [...new Set(out)];
}

export async function attachHashtagsToPost(postId: string, body: string) {
  const tags = extractHashtags(body);
  for (const tag of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag },
      create: { tag, count: 1 },
      update: { count: { increment: 1 } },
    });
    await prisma.postHashtag.upsert({
      where: {
        postId_hashtagId: { postId, hashtagId: hashtag.id },
      },
      create: { postId, hashtagId: hashtag.id },
      update: {},
    });
  }
}
