"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { PostCard } from "@/components/plume/post-card";
import type { PostCardPayload } from "@/lib/post-include";

type Profile = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  location: string | null;
  createdAt: string;
  _count: { followers: number; following: number; posts: number };
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<"posts" | "replies" | "media" | "likes">(
    "posts",
  );
  const [items, setItems] = useState<
    {
      post: PostCardPayload;
      engaged: { liked: boolean; reposted: boolean; bookmarked: boolean };
    }[]
  >([]);

  const [missing, setMissing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    void (async () => {
      const tok = localStorage.getItem("plume_token");
      const r = await fetch(
        `/api/users/${encodeURIComponent(handle)}?tab=${tab}`,
        {
          headers: tok ? { Authorization: `Bearer ${tok}` } : {},
        },
      );
      if (r.status === 404) {
        setMissing(true);
        setProfile(null);
        setItems([]);
        setReady(true);
        return;
      }
      const d = await r.json();
      setMissing(false);
      setProfile(d.profile);
      setFollowing(Boolean(d.following));
      setItems(d.items ?? []);
      setReady(true);
    })();
  }, [handle, tab]);

  async function toggleFollow() {
    const tok = localStorage.getItem("plume_token");
    const method = following ? "DELETE" : "POST";
    const r = await fetch(`/api/users/${handle}/follow`, {
      method,
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    const d = await r.json();
    setFollowing(Boolean(d.following));
    if (d.counts && profile)
      setProfile({
        ...profile,
        _count: {
          ...profile._count,
          followers: d.counts.followers,
          following: d.counts.following,
          posts: profile._count.posts,
        },
      });
  }

  if (!ready) {
    return <p className="p-14 text-center text-plume-muted">Loading…</p>;
  }

  if (missing) {
    return (
      <p className="p-14 text-center text-plume-muted">Profile not found.</p>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-[560px] pb-16">
      <div className="relative h-40 w-full bg-plume-edge">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.bannerUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="relative -mt-12 px-6">
        <Image
          src={profile.avatarUrl}
          alt=""
          width={110}
          height={110}
          className="h-[110px] w-[110px] rounded-[30px] border-4 border-plume-bg shadow-xl"
        />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[26px] font-semibold">
              {profile.name}
            </h1>
            <p className="text-plume-muted">@{profile.handle}</p>
            {profile.location && (
              <p className="mt-2 text-sm text-plume-muted">{profile.location}</p>
            )}
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed">
              {profile.bio}
            </p>
            <p className="mt-3 text-sm text-plume-muted">
              Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
            </p>
            <div className="mt-4 flex gap-6 text-sm">
              <span>
                <strong>{profile._count.following}</strong>{" "}
                <span className="text-plume-muted">Following</span>
              </span>
              <span>
                <strong>{profile._count.followers}</strong>{" "}
                <span className="text-plume-muted">Followers</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void toggleFollow()}
            className={`rounded-full border px-6 py-2 text-sm font-semibold ${
              following
                ? "border-plume-edge bg-transparent"
                : "border-plume-accent bg-plume-accent text-plume-bg"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      <div className="mt-10 flex border-b border-plume-edge">
        {(
          [
            ["posts", "Posts"],
            ["replies", "Replies"],
            ["media", "Media"],
            ["likes", "Likes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 border-b-2 py-3 text-[13px] font-semibold capitalize ${
              tab === id
                ? "border-plume-accent text-plume-text"
                : "border-transparent text-plume-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(items ?? []).map((pack) => (
        <PostCard
          key={pack.post.id}
          item={{
            kind: "post",
            post: pack.post,
            engaged: pack.engaged,
          }}
        />
      ))}

      {items.length === 0 && tab === "likes" && (
        <p className="px-8 py-8 text-plume-muted">
          Likes are private unless it is your profile.
        </p>
      )}
    </div>
  );
}
