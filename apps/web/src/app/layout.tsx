import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "K187 Recovery OS",
  description: "Local-first command center for scattered software builds.",
};

const NAV: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/works", label: "Works" },
  { href: "/agents", label: "Agents" },
  { href: "/projects", label: "Projects" },
  { href: "/duplicates", label: "Duplicates" },
  { href: "/reports", label: "Reports" },
  { href: "/ai-analysis", label: "AI Analysis" },
  { href: "/hermes", label: "Hermes" },
  { href: "/focus", label: "Focus Lock" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <aside className="w-60 border-r border-border bg-panel/40 p-4 flex flex-col gap-1 sticky top-0 h-screen">
          <div className="font-mono text-accent text-sm mb-4 px-2">K187 · Recovery OS</div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="px-2 py-1.5 text-sm rounded hover:bg-border/40 text-zinc-300 hover:text-white">
              {n.label}
            </Link>
          ))}
          <div className="mt-auto text-[10px] text-muted px-2">
            local-first · v0.1.0
          </div>
        </aside>
        <main className="flex-1 p-8 max-w-[1400px]">{children}</main>
      </body>
    </html>
  );
}
