import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

function reportsDir(): string {
  return path.resolve(process.cwd(), "..", "..", "reports");
}

export default async function ReportsPage() {
  const dir = reportsDir();
  let files: { name: string; mtime: Date; size: number }[] = [];
  try {
    const entries = await fs.promises.readdir(dir);
    for (const e of entries) {
      if (!e.endsWith(".md")) continue;
      const st = await fs.promises.stat(path.join(dir, e));
      files.push({ name: e, mtime: st.mtime, size: st.size });
    }
    files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  } catch {
    // reports dir not created yet
  }
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted text-sm">Markdown reports written to <code>reports/</code>. Generate one with <code className="text-accent">pnpm report</code>.</p>
      </header>
      <div className="panel">
        {files.length === 0 ? (
          <p className="text-sm text-muted">No reports yet. From the workspace root run: <code>pnpm report</code></p>
        ) : (
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between border-t border-border py-2">
                <div>
                  <Link href={`/api/reports/${encodeURIComponent(f.name)}`} className="font-mono text-sm hover:text-accent">{f.name}</Link>
                  <div className="text-xs text-muted">{f.mtime.toISOString()} · {f.size} bytes</div>
                </div>
                <a href={`/api/reports/${encodeURIComponent(f.name)}`} className="btn">view</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
