/**
 * POST /api/agents — log an agent run (start, update, complete).
 * GET /api/agents?limit=50 — fetch recent runs.
 *
 * Used by Hermes (self), Claude Code wrapper, recovery-OS scanner,
 * or any external script that wants to record an agent invocation.
 *
 * Body: AgentRun fields minus id/startedAt/status/delegatedBy (auto-filled).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  appendAgentRun,
  listAgentRuns,
  type AgentRun,
} from "@/lib/works";

export const runtime = "nodejs";

const KINDS: AgentRun["agentKind"][] = [
  "claude-code", "codex", "openai", "subagent", "minimax-m3", "hermes", "other",
];
const STATUSES: AgentRun["status"][] = [
  "pending", "running", "success", "fail", "timeout",
];

const AgentRunSchema = z.object({
  agentKind: z.enum(KINDS as [AgentRun["agentKind"], ...AgentRun["agentKind"][]]),
  agentName: z.string().min(1).max(200),
  intent: z.string().min(1).max(1000),
  promptSummary: z.string().min(1).max(500),
  status: z.enum(STATUSES as [AgentRun["status"], ...AgentRun["status"][]]).optional(),
  outputSummary: z.string().max(2000).optional(),
  costCents: z.number().int().nonnegative().optional(),
  finishedAt: z.string().datetime().optional(),
  delegatedBy: z.string().min(1).max(100).optional(),
  filesWritten: z.array(z.string().max(500)).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = AgentRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const run = appendAgentRun(parsed.data);
  return NextResponse.json({ ok: true, run }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const byKind = url.searchParams.get("kind") as AgentRun["agentKind"] | null;
  const byStatus = url.searchParams.get("status") as AgentRun["status"] | null;
  const rows = listAgentRuns({
    limit,
    byKind: byKind ?? undefined,
    byStatus: byStatus ?? undefined,
  });
  return NextResponse.json({ count: rows.length, items: rows });
}
