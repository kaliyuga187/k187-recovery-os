/**
 * /agents — registered external agents + their activity.
 *
 * Shows:
 *  - The 6 agent kinds Kai has access to (Claude Code, Codex, OpenAI,
 *    subagent, MiniMax M3, Hermes itself)
 *  - Their status (available? needs key? needs install?)
 *  - Recent runs (last 50)
 *  - Cost summary
 *
 * Static agent info comes from a registry in this file. Dynamic run data
 * comes from .operator/agents.jsonl.
 */
import Link from "next/link";
import { listAgentRuns, getAgentsSummary, type AgentRun } from "@/lib/works";

export const dynamic = "force-dynamic";

interface AgentInfo {
  kind: AgentRun["agentKind"];
  name: string;
  what: string;
  how: string;
  status: "available" | "needs-key" | "needs-install" | "blocked";
  statusNote: string;
  color: string;
  icon: string;
}

const AGENT_REGISTRY: AgentInfo[] = [
  {
    kind: "claude-code",
    name: "Claude Code",
    what: "Anthropic Claude Code CLI — autonomous agent for code tasks, debugging, file edits.",
    how: "Spawned via `~/.local/bin/claude.exe --print --bare`. Reads AGENTS.md from --add-dir.",
    status: "needs-key",
    statusNote: "Found at ~/.local/bin/claude.exe v2.1.139. Needs ANTHROPIC_API_KEY in env.",
    color: "#d97706",
    icon: "🟧",
  },
  {
    kind: "codex",
    name: "Codex CLI",
    what: "OpenAI Codex CLI — autonomous agent for code review and feature work.",
    how: "Not installed on this machine. `npm i -g @openai/codex` to install.",
    status: "needs-install",
    statusNote: "Run: npm i -g @openai/codex",
    color: "#10b981",
    icon: "🟩",
  },
  {
    kind: "openai",
    name: "ChatGPT (via OpenRouter)",
    what: "OpenAI GPT-4o, o1, etc. — used for general reasoning and analysis.",
    how: "HTTP call to api.openai.com with OPENAI_API_KEY. Currently routed via OpenRouter.",
    status: "needs-key",
    statusNote: "Add OPENAI_API_KEY (or use OpenRouter) to .env. Models: gpt-4o, gpt-4-turbo.",
    color: "#10b981",
    icon: "🤖",
  },
  {
    kind: "subagent",
    name: "Hermes Subagents",
    what: "delegate_task — background sub-process with isolated context.",
    how: "Spawned via Hermes delegate_task tool. Up to 3 concurrent children.",
    status: "available",
    statusNote: "Built into Hermes. Used automatically for parallel research.",
    color: "#a855f7",
    icon: "🌀",
  },
  {
    kind: "minimax-m3",
    name: "MiniMax M3",
    what: "The primary AI used by Hermes itself — long-context analysis, layman's terms summaries.",
    how: "Routed via OpenRouter. Model: minimax/minimax-m3. Default provider.",
    status: "available",
    statusNote: "Working — confirmed by 4+ successful analyses this session.",
    color: "#3b82f6",
    icon: "🧠",
  },
  {
    kind: "hermes",
    name: "Hermes (self)",
    what: "This agent — running the conversation, scanning, snapshotting, file edits.",
    how: "Native Hermes loop. MiniMax M3 in this environment.",
    status: "available",
    statusNote: "Currently active. See /session for current state.",
    color: "#ec4899",
    icon: "🌸",
  },
];

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

const STATUS_COLORS: Record<AgentInfo["status"], string> = {
  available: "#22c55e",
  "needs-key": "#f59e0b",
  "needs-install": "#a855f7",
  blocked: "#ef4444",
};

const STATUS_LABELS: Record<AgentInfo["status"], string> = {
  available: "READY",
  "needs-key": "NEEDS API KEY",
  "needs-install": "NEEDS INSTALL",
  blocked: "BLOCKED",
};

const RUN_STATUS_COLORS: Record<AgentRun["status"], string> = {
  pending: "#94a3b8",
  running: "#3b82f6",
  success: "#22c55e",
  fail: "#ef4444",
  timeout: "#f59e0b",
};

export default function AgentsPage() {
  const summary = getAgentsSummary();
  const recent = listAgentRuns({ limit: 50 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-muted text-sm">
          External agents registered in the recovery-OS. Each can be spawned
          to run work in parallel. Status reflects auth + install state.
        </p>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Total runs" value={String(summary.totalRuns)} />
        <Stat label="Running now" value={String(summary.running)} highlight={summary.running > 0} />
        <Stat label="Succeeded" value={String(summary.success)} />
        <Stat label="Failed" value={String(summary.failed)} alert={summary.failed > 0} />
        <Stat label="AI spend" value={fmtCost(summary.totalCostCents)} />
      </section>

      {/* Registry */}
      <section>
        <h2 className="font-semibold mb-3">Registered agents</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {AGENT_REGISTRY.map((a) => (
            <div
              key={a.kind}
              className="panel"
              style={{ borderColor: STATUS_COLORS[a.status] + "55" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" style={{ color: a.color }}>
                    {a.icon}
                  </span>
                  <div>
                    <div className="font-semibold text-white">{a.name}</div>
                    <div className="text-xs text-muted font-mono">{a.kind}</div>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider"
                  style={{
                    background: STATUS_COLORS[a.status] + "22",
                    color: STATUS_COLORS[a.status],
                  }}
                >
                  {STATUS_LABELS[a.status]}
                </span>
              </div>
              <p className="text-sm text-purple-200/80 mt-3">{a.what}</p>
              <p className="text-xs text-muted mt-1">{a.how}</p>
              <p
                className="text-xs mt-2 font-mono"
                style={{ color: STATUS_COLORS[a.status] }}
              >
                {a.statusNote}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent runs */}
      <section className="panel">
        <h2 className="font-semibold mb-3">Recent runs</h2>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-lg mb-2">No agent runs logged yet</p>
            <p className="text-sm">
              When Hermes spawns Claude Code, Codex, or runs a long-context analysis,
              the run will appear here with cost + outcome.
            </p>
            <p className="text-xs mt-4 font-mono">
              Log one: POST /api/agents with {"{agentKind, agentName, intent, promptSummary, status}"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="text-left py-1">Agent</th>
                <th className="text-left py-1">Intent</th>
                <th className="text-center">Status</th>
                <th className="text-center">Cost</th>
                <th className="text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-1">
                    <div className="font-mono text-xs">{r.agentKind}</div>
                    <div className="text-xs text-muted">{r.agentName}</div>
                  </td>
                  <td className="py-1">
                    <div className="truncate max-w-md" title={r.intent}>
                      {r.intent}
                    </div>
                    {r.outputSummary && (
                      <div
                        className="text-xs text-muted truncate max-w-md"
                        title={r.outputSummary}
                      >
                        → {r.outputSummary}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                      style={{
                        background: RUN_STATUS_COLORS[r.status] + "22",
                        color: RUN_STATUS_COLORS[r.status],
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="text-center font-mono text-xs">
                    {r.costCents ? fmtCost(r.costCents) : "—"}
                  </td>
                  <td className="text-right text-xs text-muted">
                    {fmtRelative(r.startedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-muted text-center">
        Want to add a new agent kind? Edit{" "}
        <code className="font-mono">apps/web/src/app/agents/page.tsx</code>{" "}
        and add to <code className="font-mono">AgentRun.agentKind</code> in{" "}
        <code className="font-mono">src/lib/works.ts</code>.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="panel">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div
        className={`text-2xl font-semibold mt-1 ${
          highlight ? "text-accent" : alert ? "text-red-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
