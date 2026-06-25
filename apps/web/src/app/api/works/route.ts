/**
 * POST /api/works — log a completed action.
 * GET /api/works?limit=50 — fetch recent work logs.
 *
 * Used by external tools (recovery-OS scanner hooks, GitHub Actions,
 * Claude Code sessions, etc.) to record what got done.
 *
 * Body: WorkLog fields minus id/performedAt/outcome (auto-filled).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  appendWorkLog,
  listWorkLogs,
  type WorkKind,
  type WorkOutcome,
} from "@/lib/works";

export const runtime = "nodejs";

const KINDS: WorkKind[] = [
  "commit", "deploy", "scan", "analysis", "fix", "docs",
  "stripe", "github", "build", "design", "ops", "other",
];
const OUTCOMES: WorkOutcome[] = ["ok", "warn", "fail"];

const WorkLogSchema = z.object({
  kind: z.enum(KINDS as [WorkKind, ...WorkKind[]]),
  title: z.string().min(1).max(500),
  detail: z.string().max(5000).optional(),
  repoSlug: z.string().max(100).optional(),
  workspacePath: z.string().max(500).optional(),
  filesTouched: z.array(z.string().max(500)).max(100).optional(),
  outcome: z.enum(OUTCOMES as [WorkOutcome, ...WorkOutcome[]]).optional(),
  performedBy: z.string().min(1).max(100).default("hermes"),
  githubRef: z.string().max(200).optional(),
  costCents: z.number().int().nonnegative().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  sessionId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = WorkLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const log = appendWorkLog(parsed.data);
  return NextResponse.json({ ok: true, log }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const byKind = url.searchParams.get("kind") as WorkKind | null;
  const byRepo = url.searchParams.get("repo") ?? undefined;
  const byPerformer = url.searchParams.get("by") ?? undefined;
  const since = url.searchParams.get("since") ?? undefined;
  const rows = listWorkLogs({
    limit,
    byKind: byKind ?? undefined,
    byRepo,
    byPerformer,
    sinceISO: since,
  });
  return NextResponse.json({ count: rows.length, items: rows });
}
