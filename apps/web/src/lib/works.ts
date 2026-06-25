/**
 * Works log — append-only JSONL file at `.operator/works.jsonl`.
 *
 * Each line is a JSON record describing one completed action. This file is
 * the source of truth for the /works dashboard page. It's deliberately
 * simple (JSONL + Node fs) so it works without Prisma client generation
 * (which segfaults on Node 24 in this environment).
 *
 * Read by apps/web pages. Written by either:
 *   - the recovery-OS scanner (via apps/scanner hooks)
 *   - this app's own API route (/api/works POST)
 *   - external scripts (just append a JSON line)
 *
 * Schema per record (all fields optional except id + performedAt):
 *   {
 *     id: string,            // cuid
 *     kind: string,          // commit | deploy | scan | analysis | fix | docs | stripe | github | other
 *     title: string,         // human-readable 1-2 line summary
 *     detail?: string,       // longer markdown
 *     repoSlug?: string,     // optional project slug
 *     workspacePath?: string,
 *     filesTouched?: string[],
 *     outcome: "ok" | "warn" | "fail",
 *     performedAt: ISO8601,
 *     performedBy: string,   // hermes | kai | claude-code | codex | openai | minimax-m3
 *     githubRef?: string,
 *     costCents?: number,
 *     tags?: string[],
 *     sessionId?: string     // FK to Session record
 *   }
 *
 * Why JSONL not Prisma:
 *   - Prisma client generation crashes on Node 24.15.0 in this env.
 *   - JSONL is grep-friendly, diff-friendly, git-friendly.
 *   - No migrations needed when schema changes.
 *   - Trivially readable from any tool.
 */
import fs from "node:fs";
import path from "node:path";

export type WorkKind =
  | "commit"
  | "deploy"
  | "scan"
  | "analysis"
  | "fix"
  | "docs"
  | "stripe"
  | "github"
  | "build"
  | "design"
  | "ops"
  | "other";

export type WorkOutcome = "ok" | "warn" | "fail";

export interface WorkLog {
  id: string;
  kind: WorkKind;
  title: string;
  detail?: string;
  repoSlug?: string;
  workspacePath?: string;
  filesTouched?: string[];
  outcome: WorkOutcome;
  performedAt: string; // ISO8601
  performedBy: string;
  githubRef?: string;
  costCents?: number;
  tags?: string[];
  sessionId?: string;
}

export interface AgentRun {
  id: string;
  agentKind:
    | "claude-code"
    | "codex"
    | "openai"
    | "subagent"
    | "minimax-m3"
    | "hermes"
    | "other";
  agentName: string;
  intent: string;
  promptSummary: string;
  status: "pending" | "running" | "success" | "fail" | "timeout";
  outputSummary?: string;
  costCents?: number;
  startedAt: string;
  finishedAt?: string;
  delegatedBy: string;
  filesWritten?: string[];
  notes?: string;
}

export interface Session {
  id: string;
  sessionId: string;
  startedAt: string;
  finishedAt?: string;
  firstPrompt?: string;
  summary?: string;
  toolCallCount: number;
  workLogIds: string[];
  platform: string;
  userLabel?: string;
}

const OPERATOR_DIR = path.resolve(
  process.cwd(),
  ".operator",
);
const WORKS_FILE = path.join(OPERATOR_DIR, "works.jsonl");
const AGENTS_FILE = path.join(OPERATOR_DIR, "agents.jsonl");
const SESSIONS_FILE = path.join(OPERATOR_DIR, "sessions.jsonl");

function ensureDir(): void {
  if (!fs.existsSync(OPERATOR_DIR)) {
    fs.mkdirSync(OPERATOR_DIR, { recursive: true });
  }
}

function readJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const out: T[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as T);
    } catch {
      // skip malformed lines
    }
  }
  return out;
}

function appendJsonl(file: string, record: unknown): void {
  ensureDir();
  fs.appendFileSync(file, JSON.stringify(record) + "\n", "utf8");
}

export function listWorkLogs(opts?: {
  limit?: number;
  sinceISO?: string;
  byKind?: WorkKind;
  byRepo?: string;
  byPerformer?: string;
}): WorkLog[] {
  let rows = readJsonl<WorkLog>(WORKS_FILE);
  if (opts?.sinceISO) {
    const since = opts.sinceISO;
    rows = rows.filter((r) => r.performedAt >= since);
  }
  if (opts?.byKind) {
    const k = opts.byKind;
    rows = rows.filter((r) => r.kind === k);
  }
  if (opts?.byRepo) {
    const s = opts.byRepo;
    rows = rows.filter((r) => r.repoSlug === s);
  }
  if (opts?.byPerformer) {
    const p = opts.byPerformer;
    rows = rows.filter((r) => r.performedBy === p);
  }
  rows.sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1));
  if (opts?.limit && opts.limit > 0) rows = rows.slice(0, opts.limit);
  return rows;
}

export function appendWorkLog(
  partial: Omit<WorkLog, "id" | "performedAt" | "outcome"> & {
    outcome?: WorkOutcome;
  },
): WorkLog {
  const record: WorkLog = {
    id: `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    performedAt: new Date().toISOString(),
    outcome: partial.outcome ?? "ok",
    ...partial,
  };
  appendJsonl(WORKS_FILE, record);
  return record;
}

export function listAgentRuns(opts?: {
  limit?: number;
  byKind?: AgentRun["agentKind"];
  byStatus?: AgentRun["status"];
}): AgentRun[] {
  let rows = readJsonl<AgentRun>(AGENTS_FILE);
  if (opts?.byKind) {
    const k = opts.byKind;
    rows = rows.filter((r) => r.agentKind === k);
  }
  if (opts?.byStatus) {
    const s = opts.byStatus;
    rows = rows.filter((r) => r.status === s);
  }
  rows.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  if (opts?.limit && opts.limit > 0) rows = rows.slice(0, opts.limit);
  return rows;
}

export function appendAgentRun(
  partial: Omit<AgentRun, "id" | "startedAt" | "status" | "delegatedBy">,
): AgentRun {
  const record: AgentRun = {
    id: `ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    status: "pending",
    delegatedBy: "hermes",
    ...partial,
  };
  appendJsonl(AGENTS_FILE, record);
  return record;
}

export function listSessions(opts?: { limit?: number }): Session[] {
  let rows = readJsonl<Session>(SESSIONS_FILE);
  rows.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  if (opts?.limit && opts.limit > 0) rows = rows.slice(0, opts.limit);
  return rows;
}

export function appendSession(
  partial: Omit<Session, "id" | "startedAt" | "platform" | "toolCallCount" | "workLogIds">,
): Session {
  const record: Session = {
    id: `se_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    platform: "telegram",
    toolCallCount: 0,
    workLogIds: [],
    ...partial,
  };
  appendJsonl(SESSIONS_FILE, record);
  return record;
}

/** Stats summary — used by /works and /agents dashboard pages. */
export interface WorksSummary {
  totalLogs: number;
  last24h: number;
  last7d: number;
  byKind: Record<string, number>;
  byPerformer: Record<string, number>;
  totalCostCents: number;
  topRepos: Array<{ slug: string; count: number }>;
}

export function getWorksSummary(): WorksSummary {
  const rows = listWorkLogs();
  const now = Date.now();
  const last24h = rows.filter(
    (r) => now - new Date(r.performedAt).getTime() < 24 * 60 * 60 * 1000,
  ).length;
  const last7d = rows.filter(
    (r) => now - new Date(r.performedAt).getTime() < 7 * 24 * 60 * 60 * 1000,
  ).length;
  const byKind: Record<string, number> = {};
  const byPerformer: Record<string, number> = {};
  const repoCounts: Record<string, number> = {};
  let totalCostCents = 0;
  for (const r of rows) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    byPerformer[r.performedBy] = (byPerformer[r.performedBy] ?? 0) + 1;
    if (r.repoSlug) {
      repoCounts[r.repoSlug] = (repoCounts[r.repoSlug] ?? 0) + 1;
    }
    totalCostCents += r.costCents ?? 0;
  }
  const topRepos = Object.entries(repoCounts)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    totalLogs: rows.length,
    last24h,
    last7d,
    byKind,
    byPerformer,
    totalCostCents,
    topRepos,
  };
}

export interface AgentsSummary {
  totalRuns: number;
  running: number;
  success: number;
  failed: number;
  byKind: Record<string, number>;
  totalCostCents: number;
  lastRun?: AgentRun;
}

export function getAgentsSummary(): AgentsSummary {
  const rows = listAgentRuns();
  const running = rows.filter((r) => r.status === "running").length;
  const success = rows.filter((r) => r.status === "success").length;
  const failed = rows.filter(
    (r) => r.status === "fail" || r.status === "timeout",
  ).length;
  const byKind: Record<string, number> = {};
  let totalCostCents = 0;
  for (const r of rows) {
    byKind[r.agentKind] = (byKind[r.agentKind] ?? 0) + 1;
    totalCostCents += r.costCents ?? 0;
  }
  const lastRun = rows[0]; // already sorted desc
  return { totalRuns: rows.length, running, success, failed, byKind, totalCostCents, lastRun };
}
