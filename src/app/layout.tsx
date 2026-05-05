import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/session-context";
import { PlumeShortcuts } from "@/components/plume/plume-shortcuts";

const dm = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plume — calm microblogs",
  description:
    "A production-style microblogging demo: timelines, replies, quotes, and discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${dm.variable} ${outfit.variable} min-h-full antialiased`}
      >
        <SessionProvider>
          <div id="plume-shell" className="min-h-full bg-plume-bg/40">
            {children}
          </div>
          <PlumeShortcuts />
        </SessionProvider>
      </body>
    </html>
  );
}
