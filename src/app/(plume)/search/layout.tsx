import { Suspense } from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-plume-muted">Searching…</div>
      }
    >
      {children}
    </Suspense>
  );
}
