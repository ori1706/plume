import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAG_RE = /#([\p{L}\p{N}_]+)/gu;

function extractHashtags(body: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, TAG_RE.flags);
  while ((m = re.exec(body)) !== null) out.push(m[1].toLowerCase());
  return [...new Set(out)];
}

async function attachHashtags(postId: string, body: string) {
  for (const tag of extractHashtags(body)) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag },
      create: { tag, count: 1 },
      update: { count: { increment: 1 } },
    });
    await prisma.postHashtag.upsert({
      where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
      create: { postId, hashtagId: hashtag.id },
      update: {},
    });
  }
}

type Persona = {
  handle: string;
  email: string;
  name: string;
  bio: string;
  location?: string;
  banner: string;
};

const personas: Persona[] = [
  {
    handle: "plume_preview",
    email: "preview@plume.show",
    name: "Avery Quinn",
    bio: "Product designer exploring humane feeds. Built Plume as a weekend lab for calm timelines.",
    location: "Portland, OR",
    banner:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "mira_chen",
    email: "mira@plume.show",
    name: "Mira Chen",
    bio: "Design systems @ an early-stage climate company. Posting gradients, grids, and garden updates.",
    location: "Vancouver",
    banner:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "jules_oka",
    email: "jules@plume.show",
    name: "Jules Okafor",
    bio: "Founder / operator. Shipping boring software that keeps teams honest about priorities.",
    location: "Lagos → London",
    banner:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "indiefocus",
    email: "indie@plume.show",
    name: "Noah Weiss",
    bio: "Indie hacker. Weekends are for revenue charts, espresso shots, and keyboard builds.",
    location: "Remote",
    banner:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "dr_clara",
    email: "clara@plume.show",
    name: "Dr. Clara Mendes",
    bio: "Microscopy + machine listening. Slow science updates and field notes from the lab.",
    location: "Coimbra",
    banner:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "cityledger",
    email: "ledger@plume.show",
    name: "Samir Desai",
    bio: "Investigative reporter covering housing and transit. DMs open for tips.",
    location: "Chicago",
    banner:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "brushandbyte",
    email: "byte@plume.show",
    name: "Elena Voss",
    bio: "Painter who codes shaders. Documenting the overlap of pigment and pixels.",
    location: "Berlin",
    banner:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "syntaxsarah",
    email: "sarah@plume.show",
    name: "Sarah Kim",
    bio: "Compiler engineer. Posting PL musings, conference hallway notes, and bread recipes.",
    location: "Seattle",
    banner:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "loopengineer",
    email: "loop@plume.show",
    name: "Marcus Ito",
    bio: "Controls + embedded. Building quiet machines for loud cities.",
    location: "Tokyo",
    banner:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "filmthread",
    email: "film@plume.show",
    name: "Amara Singh",
    bio: "Cinematographer. Shot lists, color timing diaries, and rainy night stills.",
    location: "Mumbai",
    banner:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "climatememo",
    email: "climate@plume.show",
    name: "Riley Park",
    bio: "Field researcher tracking soil carbon programs across the Pacific Northwest.",
    location: "Seattle",
    banner:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "kitchencodes",
    email: "kitchen@plume.show",
    name: "Devon Ali",
    bio: "Chef turned API designer. Food photos with surprisingly detailed alt text.",
    location: "Austin",
    banner:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "urbansketch",
    email: "urban@plume.show",
    name: "Isaac Mensah",
    bio: "Urban sketching walks every Sunday. Annotated maps inline.",
    location: "Accra",
    banner:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=80",
  },
  {
    handle: "polarfront",
    email: "polar@plume.show",
    name: "Nora Halvorsen",
    bio: "Field glaciologist. Dispatching brittle ice soundscapes and SAR snapshots.",
    location: "Tromsø",
    banner:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80",
  },
];

const starters = [
  "Shipping a small fix that makes notifications feel calmer.",
  "Today I learned the grid was lying to me—here is the actual constraint.",
  "Unpopular take: your roadmap is a lagging indicator, not a strategy.",
  "Writing up field notes after a week of surprisingly dry samples.",
  "We soft-launched the reader mode for long threads—feedback welcome.",
  "If your metrics deck starts with vanity, the rest is decoration.",
  "Sketching a calmer compose flow with fewer chrome edges.",
  "Just watched a rough cut that finally clicks on the third act turn.",
  "Microservices are not a personality.",
  "Soil moisture readings came back better than modelled—cautiously optimistic.",
  "Brutally honest standup: we under-specified the edge case and paid for it.",
  "Experimenting with quote posts that preserve context without dogpiling.",
  "Night shift in the lab but the histograms look like sunrise.",
  "Trying to keep alt text as thoughtful as the photo itself.",
  "This city’s transit map is a mood board for patience.",
  "Rust borrow checker 1, me 0.5—progress is progress.",
  "Indie revenue is lumpy; sharing the honest chart anyway.",
  "If you can describe the API in a haiku, it is probably too clever.",
  "Shot a roll on a foggy pier—grain feels honest here.",
  "Cooking is just state management with higher stakes.",
  "We need less growth hacking and more growth gardening.",
  "Teaching shaders to students who think in watercolor first.",
  "Weekend project: tiny CLI that makes git bisect less scary.",
  "Spent the morning calibrating color for a scene that is 90% rain.",
  "Local newsroom energy is collaborative panic in the best way.",
  "Found a bug that only reproduces on flaky hotel Wi-Fi—delightful.",
  "Documenting how we seed demo data without embarrassing ourselves.",
];

const tagsPool = [
  "designsystems",
  "indiehacker",
  "climate",
  "film",
  "rust",
  "sketchbook",
  "founderjournal",
  "labnotes",
  "plumeTips",
  "buildinpublic",
  "typography",
  "maps",
  "audio",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.postHashtag.deleteMany();
  await prisma.hashtag.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hash = bcrypt.hashSync("demo", 10);

  const users = await Promise.all(
    personas.map(async (p) =>
      prisma.user.create({
        data: {
          handle: p.handle,
          email: p.email,
          name: p.name,
          bio: p.bio,
          location: p.location,
          avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(p.handle)}`,
          bannerUrl: p.banner,
          passwordHash: hash,
        },
      }),
    ),
  );

  const byHandle = Object.fromEntries(users.map((u) => [u.handle, u]));
  const preview = byHandle["plume_preview"]!;

  const followPairs: [string, string][] = [
    ["plume_preview", "mira_chen"],
    ["plume_preview", "jules_oka"],
    ["plume_preview", "indiefocus"],
    ["plume_preview", "syntaxsarah"],
    ["plume_preview", "brushandbyte"],
    ["plume_preview", "filmthread"],
    ["plume_preview", "climatememo"],
    ["mira_chen", "brushandbyte"],
    ["jules_oka", "indiefocus"],
    ["indiefocus", "kitchencodes"],
    ["syntaxsarah", "loopengineer"],
    ["dr_clara", "climatememo"],
    ["cityledger", "urbansketch"],
    ["filmthread", "brushandbyte"],
    ["polarfront", "climatememo"],
    ["kitchencodes", "indiefocus"],
    ["urbansketch", "cityledger"],
    ["loopengineer", "syntaxsarah"],
  ];

  for (const [a, b] of followPairs) {
    await prisma.follow.create({
      data: {
        followerId: byHandle[a]!.id,
        followeeId: byHandle[b]!.id,
      },
    });
  }

  const posts: { id: string; authorId: string; body: string }[] = [];

  for (let i = 0; i < 210; i++) {
    const author = pick(users);
    let body = pick(starters);
    if (Math.random() < 0.45) {
      body += ` #${pick(tagsPool)}`;
    }
    if (Math.random() < 0.25) {
      const other = pick(users.filter((u) => u.id !== author.id));
      body += ` Shoutout @${other.handle} for the inspiration.`;
    }

    const withMedia = Math.random() < 0.32;
    const count = withMedia ? (Math.random() < 0.45 ? 1 : Math.random() < 0.7 ? 2 : 3) : 0;

    const created = await prisma.post.create({
      data: {
        authorId: author.id,
        body,
        media:
          count > 0
            ? {
                create: Array.from({ length: count }).map((_, idx) => ({
                  url: `https://picsum.photos/seed/${author.handle}-${i}-${idx}/900/600`,
                  width: 900,
                  height: 600,
                  sortOrder: idx,
                })),
              }
            : undefined,
      },
    });
    posts.push({ id: created.id, authorId: author.id, body });
    await attachHashtags(created.id, body);
  }

  const quoteSources = posts.slice(0, 80);
  for (let q = 0; q < 18; q++) {
    const author = pick(users);
    const src = pick(quoteSources);
    const body =
      pick([
        "Hard agree with the core point here—adding one nuance below.",
        "Quoting for the thread—this belongs in the canon.",
        "Bookmarking with commentary: the last graph is the real story.",
        "This is the energy I want on my timeline today.",
      ]) + ` #${pick(tagsPool)}`;
    const created = await prisma.post.create({
      data: {
        authorId: author.id,
        body,
        quotedPostId: src.id,
      },
    });
    await attachHashtags(created.id, body);
    posts.push({ id: created.id, authorId: author.id, body });
  }

  const parents = posts.filter((p) => p.authorId !== preview.id).slice(0, 45);
  for (let r = 0; r < 55; r++) {
    const parent = pick(parents);
    const author = pick(users);
    const body = pick([
      "This thread is excellent—especially the third paragraph.",
      "Adding a field note: we saw the same pattern with older hardware.",
      "Question: did you try the cheaper sensor stack first?",
      "Saving this for the next design critique.",
      "Minor nit: the animation curve could ease-out a touch earlier.",
    ]);
    const created = await prisma.post.create({
      data: {
        authorId: author.id,
        body,
        parentId: parent.id,
      },
    });
    await attachHashtags(created.id, body);
  }

  const topPosts = await prisma.post.findMany({
    where: { parentId: null },
    take: 120,
    orderBy: { createdAt: "desc" },
  });

  for (let l = 0; l < 420; l++) {
    const post = pick(topPosts);
    const liker = pick(users);
    await prisma.like
      .create({
        data: { userId: liker.id, postId: post.id },
      })
      .catch(() => {});
  }

  for (let rr = 0; rr < 120; rr++) {
    const post = pick(topPosts);
    const who = pick(users);
    await prisma.repost
      .create({
        data: { userId: who.id, postId: post.id },
      })
      .catch(() => {});
  }

  const nData: {
    userId: string;
    actorId: string;
    type: "LIKE" | "FOLLOW" | "REPLY" | "REPOST" | "QUOTE";
    postId?: string;
  }[] = [];

  const pid = (idx: number) => topPosts[idx]?.id;

  nData.push({
    userId: preview.id,
    actorId: byHandle["mira_chen"]!.id,
    type: "FOLLOW",
  });
  const p0 = pid(0);
  if (p0) {
    nData.push({
      userId: preview.id,
      actorId: byHandle["jules_oka"]!.id,
      type: "LIKE",
      postId: p0,
    });
  }
  const p3 = pid(3);
  if (p3) {
    nData.push({
      userId: preview.id,
      actorId: byHandle["indiefocus"]!.id,
      type: "REPLY",
      postId: p3,
    });
  }
  const p5 = pid(5);
  if (p5) {
    nData.push({
      userId: preview.id,
      actorId: byHandle["syntaxsarah"]!.id,
      type: "REPOST",
      postId: p5,
    });
  }
  const p8 = pid(8);
  if (p8) {
    nData.push({
      userId: preview.id,
      actorId: byHandle["brushandbyte"]!.id,
      type: "QUOTE",
      postId: p8,
    });
  }
  const p10 = pid(10);
  if (p10) {
    nData.push({
      userId: preview.id,
      actorId: byHandle["kitchencodes"]!.id,
      type: "LIKE",
      postId: p10,
    });
  }
  nData.push({
    userId: preview.id,
    actorId: byHandle["filmthread"]!.id,
    type: "FOLLOW",
  });

  const p12 = pid(12);
  if (p12) {
    nData.push({
      userId: byHandle["mira_chen"]!.id,
      actorId: preview.id,
      type: "LIKE",
      postId: p12,
    });
  }
  const p15 = pid(15);
  if (p15) {
    nData.push({
      userId: byHandle["climatememo"]!.id,
      actorId: preview.id,
      type: "REPLY",
      postId: p15,
    });
  }

  if (nData.length) {
    await prisma.notification.createMany({ data: nData });
  }

  console.log("Seed finished:", {
    users: users.length,
    posts: await prisma.post.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
