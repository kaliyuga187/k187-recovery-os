import { getProject, getAnalyses } from "@/lib/reports";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProject(id);
  if (!p) notFound();
  const analyses = await getAnalyses(p.id);

  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      <Link href="/projects" className="text-xs text-muted hover:text-accent">← all projects</Link>
      <header>
        <h1 className="text-2xl font-semibold font-mono">{p.slug}</h1>
        <p className="text-muted text-sm mt-1 break-all">{p.path}</p>
        {p.description && <p className="text-sm mt-3 text-zinc-300">{p.description}</p>}
      </header>

      <section className="grid grid-cols-4 gap-3">
        <ScoreCard label="Composite" value={p.compositeScore} highlight />
        <ScoreCard label="Completion" value={p.completionScore} />
        <ScoreCard label="Deploy" value={p.deployScore} />
        <ScoreCard label="Health" value={p.healthScore} />
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="panel">
          <h3 className="font-semibold mb-2">Stack</h3>
          <div className="flex flex-wrap gap-1">
            {p.stack.length === 0 && <span className="text-muted text-sm">(none detected)</span>}
            {p.stack.map((s) => <span key={s} className="pill">{s}</span>)}
          </div>
        </div>
        <div className="panel">
          <h3 className="font-semibold mb-2">Metadata</h3>
          <dl className="text-sm space-y-1">
            <div className="flex justify-between"><dt className="text-muted">Category</dt><dd>{p.category}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Source</dt><dd>{p.source}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Status</dt><dd>{p.status}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Size</dt><dd>{formatBytes(p.sizeBytes)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Files</dt><dd>{p.fileCount}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Last edit</dt><dd>{p.lastModified ? p.lastModified.slice(0, 10) : "—"}</dd></div>
          </dl>
        </div>
        <div className="panel">
          <h3 className="font-semibold mb-2">Signals</h3>
          <ul className="text-sm space-y-1">
            <Signal ok={p.hasGit} label="git" />
            <Signal ok={p.hasReadme} label="readme" />
            <Signal ok={p.hasTests} label="tests" />
            <Signal ok={p.hasDocker} label="docker" />
            <Signal ok={p.hasCi} label="CI" />
            <Signal ok={p.hasDeployGuide} label="deploy guide" />
            <Signal ok={p.hasBuildArtifacts} label="build artifacts" />
            <Signal ok={p.hasEnv} label="env file" />
          </ul>
        </div>
      </section>

      {p.notes && (
        <section className="panel border-accent/30">
          <h3 className="font-semibold mb-2 text-accent">Notes</h3>
          <p className="text-sm whitespace-pre-wrap">{p.notes}</p>
        </section>
      )}

      <section className="panel">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">AI analyses</h3>
          <span className="text-xs text-muted">{analyses.length} total</span>
        </div>
        {analyses.length === 0 && <p className="text-sm text-muted">No analyses yet. Run <code className="text-accent">pnpm analyze:long --project {p.slug}</code> from the workspace root.</p>}
        <div className="space-y-3">
          {analyses.map((a) => (
            <div key={a.id} className="border-t border-border pt-3">
              <div className="text-xs text-muted flex justify-between">
                <span>model: <span className="text-zinc-300">{a.modelUsed}</span> · action: <span className="text-accent">{a.recommendedAction}</span></span>
                <span>{a.generatedAt.toISOString()}</span>
              </div>
              <p className="text-sm mt-2">{a.summary}</p>
              {a.rationale && <p className="text-xs text-muted mt-1">{a.rationale}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const color = value >= 70 ? "text-success" : value >= 40 ? "text-warn" : "text-danger";
  return (
    <div className={`panel ${highlight ? "border-accent/40" : ""}`}>
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function Signal({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-success" : "text-muted"}>{ok ? "✓" : "·"}</span>
      <span className={ok ? "" : "text-muted"}>{label}</span>
    </li>
  );
}
