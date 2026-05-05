"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export type PlumeShellEvents = {
  openCompose: () => void;
  openShortcuts: () => void;
};

export function PlumeShortcuts() {
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const typing =
        tag === "input" ||
        tag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "?" && !typing) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("plume-shortcuts-open"));
      }
      if (
        e.key === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !typing
      ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("plume-compose-open"));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname]);

  return null;
}
