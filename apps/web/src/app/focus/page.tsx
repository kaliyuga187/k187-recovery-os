import { listProjects, getActiveBuild } from "@/lib/reports";
import { setActive, pauseActive, completeActive } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const active = await getActiveBuild();
  const projects = await listProjects();
  const top = projects.slice(0, 15);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Focus Lock</h1>
        <p className="text-muted text-sm">Pick ONE active build. Everything else is parked.</p>
      </header>

      {active ? (
        <section className="panel border-accent/40">
          <h2 className="font-semibold mb-2 text-accent">Currently active</h2>
          <div className="font-mono text-lg">{active.slug}</div>
          <div className="text-xs text-muted break-all">{active.path}</div>
          <p className="text-sm mt-2">
            Composite {active.compositeScore}/100 — finish this before touching anything else.
          </p>
          <div className="mt-3 flex gap-2">
            <form action={pauseActive}>
              <button className="btn" type="submit">Pause</button>
            </form>
            <form action={completeActive}>
              <button className="btn-primary" type="submit">Mark complete</button>
            </form>
          </div>
        </section>
      ) : (
        <section className="panel">
          <p className="text-sm text-muted">No active build set. Pick one below.</p>
        </section>
      )}

      <section className="panel">
        <h2 className="font-semibold mb-3">Pick a new active build</h2>
        <p className="text-xs text-muted mb-3">
          Or from the CLI: <code className="text-accent">pnpm active:set --project &lt;slug&gt; --reason "..."</code>
        </p>
        <ul className="space-y-1">
          {top.map((p) => (
            <li key={p.id} className="flex items-center justify-between border-t border-border py-2">
              <div>
                <Link href={`/projects/${p.slug}`} className="font-mono hover:text-accent">{p.slug}</Link>
                <div className="text-xs text-muted">
                  composite {p.compositeScore} · completion {p.completionScore} · health {p.healthScore}
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await setActive(p.id, `Set from focus page at ${new Date().toISOString()}`);
                }}
              >
                <button type="submit" className="btn-primary">Focus</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
