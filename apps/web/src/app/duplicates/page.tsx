import { listDuplicateGroups } from "@/lib/reports";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DuplicatesPage() {
  const groups = await listDuplicateGroups();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Duplicates</h1>
        <p className="text-muted text-sm">{groups.length} duplicate groups detected by stack + size-bucket fingerprint.</p>
      </header>
      {groups.length === 0 && (
        <div className="panel text-sm text-muted">No duplicate groups yet. Run <code className="text-accent">pnpm scan</code> on more folders.</div>
      )}
      {groups.map((g) => (
        <div key={g.id} className="panel">
          <div className="text-xs text-muted font-mono">{g.fingerprint}</div>
          <p className="text-sm mt-1">{g.reason}</p>
          <ul className="mt-3 space-y-1">
            {g.projects.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between border-t border-border pt-2">
                <div>
                  <span className="font-mono text-sm">{p.slug}</span>
                  {i === 0 && <span className="ml-2 text-xs text-success">[keep]</span>}
                  {i > 0 && <span className="ml-2 text-xs text-warn">[archive candidate]</span>}
                  <div className="text-xs text-muted break-all">{p.path}</div>
                </div>
                <Link href={`/projects/${p.slug}`} className="btn">open</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
