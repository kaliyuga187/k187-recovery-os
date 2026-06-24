import { listProjects, getActiveBuild, listDuplicateGroups } from "@/lib/reports";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await listProjects();
  const active = await getActiveBuild();
  const dups = await listDuplicateGroups();
  const avg = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.completionScore, 0) / projects.length)
    : 0;
  const topComplete = projects.slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted text-sm">Local-first command center. {projects.length} projects indexed.</p>
      </header>

      <section className="grid grid-cols-4 gap-4">
        <Stat label="Projects" value={String(projects.length)} />
        <Stat label="Avg completion" value={`${avg}/100`} />
        <Stat label="Duplicate groups" value={String(dups.length)} />
        <Stat label="Manus placeholders" value={String(placeholders.length)} />
      </section>

      <section className="panel">
        <h2 className="font-semibold mb-3">Active build (Focus Lock)</h2>
        {active ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-accent">{active.slug}</div>
              <div className="text-xs text-muted mt-1">{active.path}</div>
              <div className="text-xs mt-1">
                completion={active.completionScore}/100 · deploy={active.deployScore}/100 · health={active.healthScore}/100
              </div>
            </div>
            <Link href={`/projects/${active.slug}`} className="btn-primary">Open</Link>
          </div>
        ) : (
          <p className="text-sm text-muted">No active build set. <Link href="/focus" className="text-accent">Pick one</Link>.</p>
        )}
      </section>

      <section className="panel">
        <h2 className="font-semibold mb-3">Top 5 by composite score</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr><th className="text-left py-1">Slug</th><th>Composite</th><th>Completion</th><th>Deploy</th><th>Health</th><th>Stack</th><th></th></tr>
          </thead>
          <tbody>
            {topComplete.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-1 font-mono">{p.slug}</td>
                <td className="text-center"><b>{p.compositeScore}</b></td>
                <td className="text-center">{p.completionScore}</td>
                <td className="text-center">{p.deployScore}</td>
                <td className="text-center">{p.healthScore}</td>
                <td className="text-center text-xs text-muted">{p.stack.slice(0, 4).join(", ")}</td>
                <td className="text-right"><Link href={`/projects/${p.slug}`} className="btn">open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
