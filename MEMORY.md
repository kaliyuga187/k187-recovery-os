# MEMORY — K187 Recovery OS Cheatsheet

> One-page summary. Read this first when you come back to the recovery-OS.
> Everything here is **current as of 2026-06-25**.

## TL;DR

- **13 active projects** (was 36; bulk-archived 25 placeholders).
- **Top 2 ready to deploy**: `nexus-frontend` (composite 72), `123automateme-hub` (70).
- **18-product service catalog** is shipping on `123automateme.com` (live + Stripe checkout).
- **Visual dashboard** runs at `http://127.0.0.1:3737/` (standalone Node, bypasses Next.js segfault).
- **No git push without explicit permission** (AGENTS.md blocklist).

## Commands cheatsheet

### Launch the dashboard

```bash
cd /c/Users/nk187/k187-recovery-os
node scripts/dashboard-server.cjs          # http://127.0.0.1:3737/
# Or background:
node scripts/dashboard-server.cjs &
# To kill all stale instances:
taskkill //IM node.exe //F
```

### Use the recovery-OS CLI

```bash
cd /c/Users/nk187/k187-recovery-os
pnpm report                    # current leaderboard
pnpm scan --path <dir>         # index a project (CRASHES on Node 24 — work around manually)
pnpm operator:snapshot         # regenerate .operator/ projects + reports
pnpm operator analyze --project <slug>   # MiniMax M3 long analysis (needs API key)
pnpm active:show               # Focus Lock target
pnpm active:set --project <slug> --reason "..."
pnpm active:complete
```

### Git (manually — no `git push` from agents)

```bash
# Push when ready
cd /c/Users/nk187/k187-recovery-os && git push origin main
cd /c/Users/nk187/123automateme-hub && git push origin main
```

## The 13 active projects

| Slug | Composite | Category | Status |
|---|---|---|---|
| `nexus-frontend` | 72 | web-app | **ready to deploy** (Stripe already wired) |
| `123automateme-hub` | 70 | dashboard | **LIVE** + Stripe checkout |
| `app-template` (nexus-ai-mobile) | 42 | mobile-app | portfolio only (compliance: review) |
| `meme-agent` | 42 | ai-agent | plan |
| `kaio-cards` | 41 | infra | plan — ghost on this machine |
| `k187-web-store` | 38 | web-app | plan |
| `code` | 32 | misc | plan — batch of 13 dashboards |
| `react-repo` (concrete-estimator) | 30 | web-app | needs finish |
| `phantom-call-spec` | 22 | web-app | 🆕 needs evaluation |
| `ar15-mobile` | 21 | mobile-app | archive |
| `memory-extension` | 21 | trading-bot | niche |
| `memerizzle` | 21 | trading-bot | niche |
| `agent-pipeline` | 20 | ai-agent | candidate to consume `crew` |
| `crew` | 18 | ai-agent | Manus export, has source |

## Income surface

`123automateme.com` is now a **money site**:

- **`/pricing`** — 3-tier subscription: Starter $19 / Pro $49 / Studio $199 per month
- **`/services`** — 18 productized one-time offers ($199 → $10K)
  - Full-Stack SaaS: $499 / $2,500 / $10K
  - AI Agents: $199 / $999 / $5K
  - Trading: $299 / $1,500 / $5K
  - DevOps: $199 / $999 / $3K
  - Web Design: $499 / $1,500 / $5K
  - Mobile Apps: $999 / $3K / $10K
- **`/hire`** — $5,000/mo retainer (1 client at a time)
- **`/thanks/service`** — post-purchase receipt

**Blocker for first payment:** Stripe test keys in `/opt/123automateme-hub/.env` on the VPS.

## Blockers on your side

1. **`vps-audit.sh`** on `apex-prod` (139.180.174.4) — needs ssh
2. **Stripe test keys** in VPS `.env` — needs dashboard.stripe.com
3. **`ANTHROPIC_API_KEY`** — needed for Claude Code delegation
4. **Dependabot PRs** on both repos — 116 vulnerabilities (62 recovery-os + 54 hub)
5. **C7 — `solana-bundler-bot-v3-complete.zip` × 5 + `pump-engine-demo*.html` × 5** — flagged 2026-06-19, refused per AGENTS.md blocklist, still in `Downloads/`. Decide: delete, archive, or genuine scope reversal.

## The Node 24 segfault — what to know

- `apps/web` (Next 15.0.3) and `123automateme-hub` (Next 15.1.0) both segfault on Node 24.15.0
- **Workaround**: `scripts/dashboard-server.cjs` (standalone Node HTTP server, zero deps)
- **Permanent fix**: `winget install OpenJS.NodeJS.LTS.Version20.18` — then `pnpm dev` works again
- The `apps/scanner` CLI also crashes (access violation 0xC0000005). Workaround: insert projects manually via Prisma direct.

## File layout

```
k187-recovery-os/
├── AGENTS.md                      # master conventions (BLOCKLIST lives here)
├── DASHBOARD.md                   # single-source-of-truth executive view
├── BUILD_REPORT.md                # change log
├── MEMORY.md                      # THIS FILE
├── .operator/
│   ├── works.jsonl                # activity log (drives /works page)
│   ├── agents.jsonl               # agent runs (drives /agents page)
│   └── projects/<slug>/           # per-project memory
├── data/k187.db                   # SQLite registry (gitignored)
├── scripts/dashboard-server.cjs   # standalone dashboard
└── apps/{scanner,web}/            # CLI + (broken-on-Node-24) Next.js dashboard
```

```
123automateme-hub/
├── src/app/
│   ├── page.tsx                   # home (1005 lines, polished SaaS CV)
│   ├── pricing/page.tsx           # 3-tier subscription
│   ├── services/                  # 🆕 18-product catalog
│   ├── hire/                      # 🆕 $5K/mo retainer
│   └── thanks/                    # post-purchase receipts
└── src/lib/services.ts            # 🆕 typed catalog of 6 services × 3 packages
```

## AGENTS.md blocklist (the rules that never change)

**Never read/store/print/send to an AI provider:** `.env`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`, `id_dsa`, `id_ecdsa`, `.npmrc`, `.pypirc`, `.netrc`, GitHub tokens, OpenAI/Anthropic/Stripe keys, bearer tokens, private key blocks, seed phrases, wallet secrets, passwords.

**Never run from the scanner or any K187 tool:** `rm`, `rmdir`, `del`, `Remove-Item`, `curl`, `wget`, `Invoke-WebRequest`, `Invoke-RestMethod`, `ssh`, `scp`, `rsync`, `sftp`, `git push`, `git remote add`, `git config --global`, `npm publish`, `pnpm publish`, `yarn publish`, `base64 -d`, `keytool`, `openssl req`.

**Always ignore:** `node_modules`, `.git`, `.next`, `dist`, `build`, `coverage`, `.venv`, `__pycache__`, `target`, `vendor`.

**Kai refuses** to BUILD/EXTEND/DEPLOY/OPERATE manipulation-tooling execution code (Jito MEV bundlers, wash-trading, sniping, pump.fun sniping). **Describing/showcasing is legitimate; helping ingest+summarize is in scope.** **Refuse execution-layer; accept portfolio/docs-layer.**

## Environment

- **Node**: 24.15.0 (too new for Next.js 15.0/15.1)
- **pnpm**: 11.1.3
- **Python**: 3.11.15 default, 3.12 via `py -3.12`
- **GitHub**: `kaliyuga187`, 93 repos (49 public + 44 private)
- **VPS**: Vultr 139.180.174.4 (apex-prod), 10 Docker + 6 PM2 bots
- **Hermes home**: `C:\Users\nk187\AppData\Local\hermes\`

## What to do next (priority order)

1. **`winget install OpenJS.NodeJS.LTS.Version20.18`** — unlocks `pnpm dev` everywhere
2. **Run `vps-audit.sh`** on the VPS — point at live keys
3. **Add Stripe test keys** to VPS `.env` — first real test charge
4. **Set `ANTHROPIC_API_KEY`** — enables Claude Code delegation
5. **Add `STRIPE_SECRET_KEY` to local `.env`** — develop against real Stripe locally
6. **Review + merge Dependabot PRs** — fixes 116 vulnerabilities + Next 15.5.18 (Node 24 compat)
7. **Decide C7** — the manipulation-tooling files still in Downloads/

## Recent commits (recovery-OS)

```
2c4a33d docs: BUILD_REPORT for Round 3 (dashboard workaround + commits log)
f5a2c56 docs: launch-dashboard.md + log working POST endpoint
b8b74c5 fix(dashboard): add missing appendJSONL/appendWorkLog/appendAgentRun helpers
f5f44c4 feat(dashboard): standalone Node server works around Next.js + Node 24 segfault
c6a1fc1 feat(visibility): bulk-private own repos + feat(dashboard): /works + /agents
fd1b24e docs: extend BUILD_REPORT with Round 2 (AGENTS.md + marketing + GitHub health)
31b9dd5 feat(reports): add marketing summaries for 11 active projects + 93-repo GitHub health grid
94142b9 chore(gitignore): exclude *.bak-* stale backups and analyze-*.log files
a60105e chore: initial commit of k187-recovery-os
```

## Recent commits (123automateme-hub)

```
c36be00 docs: BUILD_REPORT-monetize.md for the 18-product catalog
31bd9b2 feat(monetize): 18-product service catalog + /services + /hire + Stripe checkout
fe8f447 docs(agents): add AGENTS.md so delegated Claude/Codex sessions inherit the same conventions
08e2d91 docs: add DEPLOY-RUNBOOK.md for Stripe checkout activation
9d15921 feat(pricing): 3-tier Stripe checkout + webhook + thanks page
03d1499 feat: mission-control dashboard at /mission-control
```
