import { listProjects, getAnalyses } from "@/lib/reports";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AIAnalysisPage() {
  const projects = await listProjects();
  // pull counts of analyses per project
  const counts = await Promise.all(
    projects.map(async (p) => ({ p, count: (await getAnalyses(p.id)).length }))
  );
  const withAnalyses = counts.filter((c) => c.count > 0);
  const noAnalyses = counts.filter((c) => c.count === 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">AI analysis</h1>
        <p className="text-muted text-sm">
          Long-context analysis via MiniMax M3 (or heuristic fallback). Run from the CLI:
          <code className="text-accent ml-2">pnpm analyze:long --project &lt;slug&gt;</code> or
          <code className="text-accent ml-2">--all</code>.
        </p>
      </header>

      <section className="panel">
        <h2 className="font-semibold mb-2">Analyzed ({withAnalyses.length})</h2>
        <ul className="text-sm space-y-1">
          {withAnalyses.map(({ p, count }) => (
            <li key={p.id} className="flex items-center justify-between border-t border-border py-2">
              <Link href={`/projects/${p.slug}`} className="font-mono hover:text-accent">{p.slug}</Link>
              <span className="text-xs text-muted">{count} analysis record(s)</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="font-semibold mb-2">Not yet analyzed ({noAnalyses.length})</h2>
        <ul className="text-sm space-y-1">
          {noAnalyses.map(({ p }) => (
            <li key={p.id} className="flex items-center justify-between border-t border-border py-2">
              <Link href={`/projects/${p.slug}`} className="font-mono hover:text-accent">{p.slug}</Link>
              <span className="text-xs text-muted">composite {p.compositeScore}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
