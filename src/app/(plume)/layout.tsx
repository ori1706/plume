import { AppShell } from "@/components/plume/app-shell";

export default function PlumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
