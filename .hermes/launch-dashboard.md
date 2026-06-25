# How to launch the recovery-OS dashboard

## Fastest path (works on Node 24)

```bash
cd /c/Users/nk187/k187-recovery-os
node scripts/dashboard-server.cjs
```

Then open http://127.0.0.1:3737/

This is a standalone Node HTTP server that reads `.operator/works.jsonl` and
`.operator/agents.jsonl` and renders the visual dashboard. Zero dependencies.
Works around the Next.js + Node 24 segfault.

## What it shows

- **`/`** — Dashboard with summary cards + recent activity timeline
- **`/works`** — Full timeline of every action, by-kind + by-performer breakdown
- **`/agents`** — Registry of 6 agent kinds + recent runs table
- **`/api/works?limit=50`** — JSON
- **`/api/agents?limit=50`** — JSON
- **`/api/summary`** — Combined stats

## Adding new entries

POST to `/api/works` or `/api/agents` with JSON:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"kind":"commit","title":"Did something","performedBy":"kai"}' \
  http://127.0.0.1:3737/api/works
```

Or just `echo '{"kind":"..."}' >> .operator/works.jsonl` directly.

## Backgrounding

To run persistently:

```bash
node scripts/dashboard-server.cjs &
```

Then it's at the URL above. Kill with:

```bash
taskkill //IM node.exe //F
```

## When to delete

Once Node 20 LTS is installed (or Next 15.5+ ships Node 24 support),
delete this script and use `pnpm dev` from `apps/web/`.
