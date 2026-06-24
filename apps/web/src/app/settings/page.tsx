import { prisma } from "@k187/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.settings.findMany();
  const all = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted text-sm">All data is local — SQLite file at <code>data/k187.db</code>.</p>
      </header>

      <section className="panel">
        <h2 className="font-semibold mb-2">Local DB</h2>
        <dl className="text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-muted">Active build</dt><dd className="font-mono">{all.active_build || "(none)"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Focus lock until</dt><dd className="font-mono">{all.focus_lock_until || "(none)"}</dd></div>
        </dl>
      </section>

      <section className="panel">
        <h2 className="font-semibold mb-2">Scanner paths</h2>
        <p className="text-sm text-muted">To scan a new folder, run from the workspace root:</p>
        <pre className="text-xs bg-bg p-2 rounded mt-2 overflow-x-auto">{`pnpm scan --path "C:/Users/<you>/some-folder"`}</pre>
      </section>

      <section className="panel">
        <h2 className="font-semibold mb-2">AI provider</h2>
        <p className="text-sm text-muted">Set in environment before running the scanner:</p>
        <pre className="text-xs bg-bg p-2 rounded mt-2 overflow-x-auto">{`K187_AI_PROVIDER=minimax-m3
MINIMAX_API_KEY=...
MINIMAX_BASE_URL=https://api.minimax.example/v1`}</pre>
        <p className="text-xs text-muted mt-2">Provider is selected per run; the dashboard reads whatever the CLI has stored.</p>
      </section>

      <section className="panel">
        <h2 className="font-semibold mb-2">Hermes skills</h2>
        <p className="text-sm text-muted">Install all 6 K187 skills:</p>
        <pre className="text-xs bg-bg p-2 rounded mt-2 overflow-x-auto">pnpm hermes:skills</pre>
      </section>
    </div>
  );
}
