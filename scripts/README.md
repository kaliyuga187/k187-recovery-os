# Scripts

## `dashboard-server.cjs`

Standalone HTTP dashboard server (no Next.js, no React, no build).

### Why

`pnpm dev` and `pnpm build` segfault on Node 24.15.0 in this environment
(both `123automateme-hub` Next 15.1.0 and `apps/web` Next 15.0.3 are affected —
Next 15.x doesn't list Node 24 in its semver). This script bypasses that
entirely: it reads `.operator/works.jsonl` + `.operator/agents.jsonl` and
serves a hand-written HTML dashboard on port 3737.

### Usage

```
node scripts/dashboard-server.cjs
# or
./scripts/dashboard-server.cjs
```

Then open http://127.0.0.1:3737/

### Routes

- `GET /` — dashboard
- `GET /works` — full timeline
- `GET /agents` — registry + recent runs
- `GET /api/works?limit=50` — JSON
- `GET /api/agents?limit=50` — JSON
- `GET /api/summary` — combined stats

### Env vars

- `DASHBOARD_PORT` — port (default 3737)
- `DASHBOARD_HOST` — host (default 127.0.0.1; set to 0.0.0.0 if you need LAN access)

### When to delete

Once you install Node 20 LTS (`winget install OpenJS.NodeJS.LTS.Version20.18`)
or upgrade to Next 15.5+ (which supports Node 24), delete this script and
use `pnpm dev` from `apps/web/`. Until then, this is the only way to see
the dashboard rendered.

### What it does NOT do

- No real-time updates (refresh page to see new entries)
- No login / multi-user (localhost only by default)
- No rich formatting (uses inline CSS only)
- No DB writes (read-only over the JSONL files)
