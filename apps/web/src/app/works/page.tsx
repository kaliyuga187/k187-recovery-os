/**
 * /works — visual timeline of all completed actions.
 *
 * Source: .operator/works.jsonl (one JSON record per line).
 * Renders in reverse-chronological order. Color-coded by kind.
 * No database required — pure file I/O. No Prisma generation needed.
 */
import Link from "next/link";
import {
  listWorkLogs,
  getWorksSummary,
  type WorkKind,
  type WorkLog,
} from "@/lib/works";

export const dynamic = "force-dynamic";

const KIND_COLORS: Record<WorkKind, string> = {
  commit: "#22c55e",
  deploy: "#3b82f6",
  scan: "#a855f7",
  analysis: "#d946ef",
  fix: "#ef4444",
  docs: "#06b6d4",
  stripe: "#635bff",
  github: "#8b5cf6",
  build: "#f59e0b",
  design: "#ec4899",
  ops: "#64748b",
  other: "#94a3b8",
};

const KIND_ICONS: Record<WorkKind, string> = {
  commit: "●",
  deploy: "▲",
  scan: "◎",
  analysis: "★",
  fix: "✕",
  docs: "✎",
  stripe: "$",
  github: "❯",
  build: "⚒",
  design: "◐",
  ops: "⚙",
  other: "·",
};

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtCost(cents: number): string {
  if (cents === 0) return "free";
  if (cents < 100) return `${cents}¢`;
  return `$${(cents / 100).toFixed(2)}`;
}

export default function WorksPage() {
  const summary = getWorksSummary();
  const recent = listWorkLogs({ limit: 200 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Works</h1>
        <p className="text-muted text-sm">
          What got done — by Hermes, Kai, Claude Code, Codex, and MiniMax M3.
          Reverse-chronological log of every action.
        </p>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total actions" value={String(summary.totalLogs)} />
        <Stat label="Last 24h" value={String(summary.last24h)} highlight={summary.last24h > 0} />
        <Stat label="Last 7d" value={String(summary.last7d)} />
        <Stat
          label="AI spend"
          value={fmtCost(summary.totalCostCents)}
          sub={summary.totalCostCents === 0 ? "all-heuristic or free" : undefined}
        />
      </section>

      {/* By kind + by performer breakdown */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="panel">
          <h2 className="font-semibold mb-3">By kind</h2>
          <Breakdown data={summary.byKind} colors={KIND_COLORS} />
        </div>
        <div className="panel">
          <h2 className="font-semibold mb-3">By performer</h2>
          <Breakdown data={summary.byPerformer} colors={PERFORMER_COLORS} />
        </div>
      </section>

      {/* Top repos */}
      {summary.topRepos.length > 0 && (
        <section className="panel">
          <h2 className="font-semibold mb-3">Top repos touched</h2>
          <div className="flex flex-wrap gap-2">
            {summary.topRepos.map((r) => (
              <Link
                key={r.slug}
                href={`/projects/${r.slug}`}
                className="px-3 py-1.5 rounded-lg bg-panel-2 hover:bg-accent/20 text-sm"
              >
                <span className="font-mono">{r.slug}</span>
                <span className="ml-2 text-muted">{r.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent timeline */}
      <section className="panel">
        <h2 className="font-semibold mb-3">Recent timeline</h2>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-lg mb-2">No work logged yet</p>
            <p className="text-sm">
              As actions complete (commits, deploys, analyses, Stripe charges),
              they&apos;ll appear here automatically.
            </p>
            <p className="text-xs mt-4 font-mono">
              Log one manually: POST /api/works with {"{kind, title, performedBy}"}
            </p>
          </div>
        ) : (
          <ol className="relative space-y-3 border-l border-border ml-3 pl-6">
            {recent.map((r) => (
              <li key={r.id} className="relative">
                <span
                  className="absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{
                    background: KIND_COLORS[r.kind] ?? "#94a3b8",
                    color: "black",
                  }}
                  title={r.kind}
                >
                  {KIND_ICONS[r.kind] ?? "·"}
                </span>
                <WorkRow log={r} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div className="panel">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div
        className={`text-2xl font-semibold mt-1 ${highlight ? "text-accent" : ""}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

const PERFORMER_COLORS: Record<string, string> = {
  hermes: "#a855f7",
  kai: "#ec4899",
  "claude-code": "#d97706",
  codex: "#10b981",
  openai: "#10b981",
  "minimax-m3": "#3b82f6",
};

function Breakdown({
  data,
  colors,
}: {
  data: Record<string, number>;
  colors: Record<string, string>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3 text-sm">
          <span className="font-mono w-32 truncate" title={k}>
            {k}
          </span>
          <div className="flex-1 h-2 bg-panel-2 rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${(v / max) * 100}%`,
                background: colors[k] ?? "#64748b",
              }}
            />
          </div>
          <span className="font-mono w-10 text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

function WorkRow({ log }: { log: WorkLog }) {
  const color = KIND_COLORS[log.kind] ?? "#94a3b8";
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: color }}>
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="font-medium text-white">{log.title}</div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span title={log.performedAt}>{fmtRelative(log.performedAt)}</span>
          <span className="font-mono" style={{ color }}>
            {log.kind}
          </span>
          <span className="font-mono">{log.performedBy}</span>
          {log.outcome !== "ok" && (
            <span
              className="px-1.5 py-0.5 rounded font-mono"
              style={{
                background: log.outcome === "fail" ? "#ef444433" : "#f59e0b33",
                color: log.outcome === "fail" ? "#fca5a5" : "#fbbf24",
              }}
            >
              {log.outcome}
            </span>
          )}
          {log.costCents ? (
            <span className="font-mono">{fmtCost(log.costCents)}</span>
          ) : null}
        </div>
      </div>
      {log.detail && (
        <div className="text-sm text-muted mt-1 whitespace-pre-wrap">
          {log.detail}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
        {log.repoSlug && (
          <Link href={`/projects/${log.repoSlug}`} className="text-accent hover:underline">
            → {log.repoSlug}
          </Link>
        )}
        {log.githubRef && (
          <span className="font-mono text-purple-300">{log.githubRef}</span>
        )}
        {log.filesTouched && log.filesTouched.length > 0 && (
          <span className="text-muted">
            {log.filesTouched.length} file{log.filesTouched.length === 1 ? "" : "s"}
          </span>
        )}
        {log.tags && log.tags.map((t) => (
          <span
            key={t}
            className="px-1.5 py-0.5 rounded bg-panel-2 font-mono text-muted"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
