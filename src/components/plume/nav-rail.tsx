"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Item({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-full px-4 py-2.5 font-medium transition-colors ${
        active
          ? "bg-plume-edge text-plume-text"
          : "text-plume-muted hover:bg-plume-edge/55 hover:text-plume-text"
      }`}
    >
      <span aria-hidden className="w-8 text-xl text-center">
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function NavRail({
  onComposeClick,
  profileHref,
}: {
  onComposeClick: () => void;
  profileHref: string;
}) {
  return (
    <nav className="flex flex-col gap-1 shrink-0 w-full sm:w-52 xl:w-56 sticky top-0 py-6 h-fit">
      <div className="px-4 mb-2 font-display tracking-tighter text-xl font-semibold bg-gradient-to-r from-plume-accent to-plume-accent-2 bg-clip-text text-transparent">
        Plume
      </div>
      <Item href="/" label="Home" icon="◇" />
      <Item href="/explore" label="Explore" icon="◎" />
      <Item href="/notifications" label="Notifications" icon="⚑" />
      <Item href={profileHref} label="Profile" icon="◆" />
      <button
        type="button"
        onClick={onComposeClick}
        className="mt-3 w-[90%] sm:w-auto rounded-full bg-plume-accent px-5 py-3 text-[15px] font-semibold text-plume-bg shadow-lg shadow-plume-accent/25 hover:brightness-110"
      >
        Compose
      </button>
      <p className="mt-10 px-4 text-[11px] text-plume-muted leading-relaxed hidden sm:block">
        Press <kbd className="px-1 py-px rounded bg-plume-edge border border-plume-edge/70">n</kbd>{" "}
        to write · <kbd className="px-1 py-px rounded bg-plume-edge border border-plume-edge/70">?</kbd>{" "}
        for shortcuts
      </p>
    </nav>
  );
}
