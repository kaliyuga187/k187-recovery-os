# K187 Recovery OS

Local-first command center for recovering, organizing, comparing, and completing scattered software builds.

## What it does

- Scans local folders and detects projects + stacks + categories.
- Scores each project 0-100 on completion, deploy readiness, and health.
- Detects duplicate projects via stack + size-bucket fingerprint.
- Imports Manus exports (JSON directory; ZIP must be extracted first).
- Runs long-context analysis via MiniMax M3 (or heuristic fallback).
- Manages an "active build" (Focus Lock) — finish one thing at a time.
- Generates markdown reports.
- Exposes all of the above in a local Next.js 15 dashboard.

## Stack

- pnpm monorepo
- Next.js 15 + TypeScript + Tailwind
- Prisma + SQLite (local file)
- Node.js scanner CLI (commander + chalk)
- Optional AI provider layer (MiniMax M3)

## Layout

    apps/
      web/        Next.js 15 dashboard (10 pages)
      scanner/    Node CLI (scan, report, compare, import, analyze, active, hermes:skills)
    packages/
      shared/     types, scoring, duplicate detection, category detection, redaction
      db/         Prisma schema + client + seed
      ai/         provider-agnostic AI layer (MiniMax M3 adapter)

## Quick start

    cd C:/Users/nk187/k187-recovery-os
    pnpm install
    pnpm db:push
    pnpm db:seed
    pnpm scan --path "C:/Users/<you>"
    pnpm report
    pnpm dev   # dashboard on http://localhost:3737

## Core CLI commands

    pnpm scan --path "./some-folder"           # scan a folder
    pnpm report                                  # print + write weekly report
    pnpm compare:duplicates                      # group duplicates
    pnpm import:manus --path "./manus-exports"   # import a Manus export
    pnpm import:manus --path "./export.json"     # import a single JSON
    pnpm analyze:long --project <slug>           # single project
    pnpm analyze:long --all                      # every project
    pnpm active:set --project <slug>             # set Focus Lock
    pnpm active:show                             # show active
    pnpm active:pause                            # pause
    pnpm active:complete                         # mark complete
    pnpm hermes:skills                           # install the 6 K187 Hermes skills

## Operating rules

- Recover before create.
- Finish one build at a time.
- Manus is a source history, not the final source of truth.
- Local repo + GitHub is the final source of truth.
- Do not send secrets to AI providers; redaction is applied automatically.

## Core workflow

1. Recover (scan, import:manus)
2. Organize (categorize, score)
3. Compare (duplicates, recommendations)
4. Finish (active:set, Claude Code delegation)
5. Test (BUILD_REPORT.md from Claude Code)
6. Deploy
7. Document
8. Monetize
9. Expand
