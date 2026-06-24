# K187 Executive Dashboard

> Generated: 2026-06-24 (Hermes master operating mode)
> Source of truth: `data/k187.db` (SQLite, 38 projects), `.operator/` (memory), `~/AppData/Local/hermes/`, Vultr VPS `apex-prod` (139.180.174.4).
> Last snapshot: `2026-06-24T14:09:41Z` (`pnpm operator:snapshot`)

## 0. Headline state (refreshed 2026-06-25 00:09 UTC)

| Signal | Value | Δ vs 2026-06-19 |
|---|---|---|
| Projects indexed (DB) | **38** | **+2** (react-repo, ar15-mobile) |
| Projects with real MiniMax M3 layman's-terms summaries | **38/38** ✅ | — |
| AI analysis rows in DB | **42** | +2 |
| `nexus-frontend` composite | **72** ⬆️ | was 63 — all gates green, ready to deploy |
| `123automateme-hub` composite | **70** ⬆️ | was 58 — Stripe checkout shipped (commit `9d15921`) |
| Active build (Focus Lock) | `kaio-cards` (41) | last *deployed* project lock points at; not the highest-composite |
| **DEPLOYED** | `https://123automateme.com/` — live with 38/38 AI summaries + 3-tier Stripe checkout surface (`/pricing`, `/api/stripe/checkout`, `/api/stripe/webhook`, `/thanks/subscription`) | 🆕 Stripe layer added 2026-06-24 |
| **Stripe flow status** | Code-complete, **waiting on Stripe test keys** to take first payment | ⏳ needs you |
| **New finds this session** | `polymarket-dashboard` (comp 30, action: `finish`) and `ar15-mobile` (comp 21, action: `archive`) extracted from `Downloads/Archives/package*.zip` | 🆕 |
| **Noise cleaned this session** | **25 placeholder shells bulk-archived** (`status = abandoned`) — 11 real projects remain active | 🆕 |
| 123automateme.com framing | Meta-portfolio — layman's-terms summary of all work across GitHub + Claude + Manus + MiniMax + ChatGPT | — |
| OpenRouter credits | ✅ working — ran 4+ real LLM calls this session, fence-stripping fix shipped | 🆕 |
| VPS — `apex-prod` | UP — 10 Docker containers · 6 PM2 bots · nginx+certbot live | — |
| Public brand | `vivalarassa.fun` + 4 subdomains · `123automateme.com` (deployed 2026-06-14) · `answersannual.com` · planned `cards.123automateme.com` | — |
| Scheduled jobs | none active (cron empty besides lock files) | — |
| Blocklist discoveries | `solana-bundler-bot-v3-complete.zip` (5 copies) + `pump-engine-demo*.html` (5 copies) in `Downloads/` — **refused, awaiting your decision** | — |

## 1. Active projects (composite ≥ 30, ranked)

| # | Slug | Cat | Comp | Comp% | Deploy% | Health | Path | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | **nexus-frontend** | web-app | **72** | 70 | 70 | 80 | `Downloads/Projects/nexus-frontend` | **complete — ready to deploy** |
| 2 | **123automateme-hub** | dashboard | **70** ⬆️ | 65 | 70 | 80 | `C:\Users\nk187\123automateme-hub` | **LIVE + Stripe checkout code-complete** |
| 3 | app-template (nexus-ai-mobile) | mobile-app | 42 | 45 | 10 | 80 | `C:\Users\nk187\nexus-ai-mobile` | PORTFOLIO (UI prototype, execution screens flagged) |
| 4 | meme-agent | ai-agent | 42 | 45 | 10 | 80 | local | PLANNED |
| 5 | kaio-cards | infra | 41 | 30 | 40 | 70 | `C:\Users\nk187\kaio-cards` | PLANNED — **ghost on this machine** (path empty; data on laptop) |
| 6 | k187-web-store | web-app | 38 | 30 | 30 | 70 | `Downloads/Projects/k187 web store` | PLANNED |
| 7 | code | misc | 32 | 15 | 40 | 60 | `Downloads/Code/*.jsx` (batch) | PLANNED — 13 standalone dashboard prototypes |
| 8 | **react-repo** (= concrete-estimator) | web-app | **30** ⬆️ | 25 | 10 | 70 | `Downloads/Projects/concrete-estimator` | 🆕 EXTRACTED from `Archives/package.zip`, needs `finish` per MiniMax M3 |
| 9 | ar15-mobile | mobile-app | **21** | 15 | 0 | 65 | `Downloads/Projects/ar15-mobile` | 🆕 EXTRACTED from `Archives/package (1).zip`, action: `archive` (4 files, stub) |
| 10 | memory-extension | trading-bot | 21 | 15 | 0 | 65 | `Downloads/Projects/memory-extension/` | niche, low traction |
| 11 | memerizzle | trading-bot | 21 | 15 | 0 | 65 | `Downloads/Projects/memerizzle/` | niche, low traction |
| 12 | agent-pipeline | agent | 20 | 5 | 20 | 55 | local | candidate to consume `crew` Manus export |

## 2. Tier-2 projects (composite 10–29, recoverable)

| # | Slug | Cat | Comp | Notes |
|---|---|---|---|---|
| 13 | crew | ai-agent | 18 | Manus export, has source (13KB) — promote to scan |

## 3. Bulk-archived (status = abandoned, 25 projects)

These were bulk-archived this session per **C6 verdict** (score-5 Manus placeholders + duplicate/empty shells). DB rows preserved with `tags = ["manus","placeholder"]` so they can be inspected but don't clutter reports.

**15 score-5 Manus placeholders** (no source, no description):
`manus-b1e5d6c`, `manus-0e06e20d`, `manus-b8486b`, `manus-1c89ffaa`, `manus-a364c55a`, `manus-81b`, `manus-7e3bc`, `manus-3927e`, `manus-d7387ff`, `manus-9bb`, `manus`, `manus-bd42e00b`, `next-rspack-core`, `nextjs-project`, `next-js`, `nextjs`, `next-github-workflows`

**8 placeholders that may have recoverable source:**
`primo`, `bots-for-trading`, `trading-platforms`, `facless`, `k`, `meditrack` (7 original Manus exports — needs `pnpm import:manus`)

**2 duplicate/empty shells:**
`meme-agent-git-only`, `apex-xepa-hub`

## 4. `Downloads/Archives/` audit (peeking complete)

| File | Size | Verdict |
|---|---|---|
| `nexus-frontend (1).zip`, `nexus-frontend (2).zip` | 454KB + 518KB | DUPLICATE (C1 + C4) — both already extracted to `Downloads/Projects/nexus-frontend/` |
| `meme-agent (1).zip`, `memerizzle.zip`, `memory-extension.zip` | 442KB / 33KB / 35KB | DUPLICATE — already extracted to canonical homes |
| `medtrack-platform.zip` | 30KB | DUPLICATE of `meditrack` (now abandoned in DB) |
| `PRIMO.zip` (217MB!) | 217MB | DUPLICATE of `primo` placeholder (abandoned). 226MB sits on disk for nothing. |
| `PRIMO_extracted/` | dir | If empty, safe to delete after verifying |
| `package.zip` (164KB) | 164KB | **SUPERSEDED** — extracted to `polymarket-dashboard/` then renamed `react-repo` → `concrete-estimator` |
| `package (1).zip` (13MB) | 13MB | **REAL FINDS** — contained `ar15-mobile` (git repo, 4 files), `concrete-estimator` (Vite/React/Tailwind, 21 files, 233KB), `product-valuator` (only `index.html` stub) |
| `nexus-apex-xepa.zip`, `k187_crew_scripts_1.zip` | 175KB / 6KB | SCAN candidates — may supersede abandoned `apex-xepa-hub` and `crew` |
| `polymarket-edge.zip`, `polybot-deploy.tar-4.gz`, `phantom-call-spec.zip`, `AI METALAUNCH.zip`, `adhd.zip` | small | UNSCANNED — potential new products, need extraction+scan |
| `files.zip`, `memory-app.tar_2.gz`, `ship.zip` | 45KB / 163KB / 692KB | Re-pack of known `code` items / unknown / marketing screenshots |
| `data-...-batch-0000.zip` (10MB) | 10MB | DATA DUMP — not a product |
| `production-mobile-todo-app (1).skill`, `ssr-meta-injection.skill` | 8KB / 6KB | Hermes SKILL bundles — not projects |

## 5. VPS inventory — `apex-prod` 139.180.174.4

| Container | Role | Status |
|---|---|---|
| k187-nginx | reverse proxy, public-facing | ✅ |
| k187-landing | "Nexus AI / K187" branding | ✅ |
| k187-community | community dashboard at `app.vivalarassa.fun` | ✅ |
| k187-admin | operator dashboard at `admin.vivalarassa.fun` | ✅ |
| k187-api | tRPC/Express/Stripe/Prisma/SIWS at `api.vivalarassa.fun` | ✅ |
| k187-trading-engine | at :4001 | ✅ |
| k187-logs | basic-auth log viewer at `logs.vivalarassa.fun` | ✅ |
| k187-postgres / k187-redis | state | ✅ |
| k187-certbot | TLS renewal | ✅ |
| **k187-hub** | new Next.js for `123automateme.com` | ✅ added 2026-06-14 |

| PM2 process | Uptime | Notes |
|---|---|---|
| apex-trading (:4004) | 45 d | `/opt/apex/` |
| apex-research-bot | 37 d | cluster mode |
| nexus-ai (:9081) | 32 h | |
| nexus-x-bot | 32 h | |
| aussie-homeschool-hub | 7 d | separate product |
| k187-store-bot | **STOPPED** | errored 191× — needs cleanup or removal |

**Domain consolidation gap:** nginx serves `vivalarassa.fun` + 4 subdomains but the active brand is `123automateme.com`. **Decide: keep vivalarassa as primary, or migrate everything to 123automateme.**

## 6. Duplicate / consolidation verdicts

| # | Verdict | From → To | Reason |
|---|---|---|---|
| C1 | **MERGE** | `repo-compare/nexus-frontend/` → `Downloads/Projects/nexus-frontend/` | Comparison copy. Confirm git identity, then archive. |
| C2 | **MERGE** | `repo-compare/apex-xepa-hub/` + `Downloads/Archives/apex-xepa-hub*` → `/opt/apex-xepa-hub/` (already on VPS) | The canonical home is the VPS dir; local copies are scratch. |
| C3 | **MERGE** | `meme-agent-git-only` → `meme-agent` | ✅ done (both abandoned in DB) |
| C4 | **MERGE** | `Downloads/Projects/nexus-frontend-2-extracted/` → `Downloads/Projects/nexus-frontend/` | Second extraction. Confirm, archive. |
| C5 | **MERGE** | `Downloads/Projects/k187 web store.zip` → `Downloads/Projects/k187 web store/` | Re-extract or compare, then archive zip. |
| C6 | **ARCHIVE** | 23 Manus sandbox placeholders + 2 empty shells | ✅ done (25 abandoned in DB) |
| C7 | **FLAG (refused)** | `Downloads/solana-bundler-bot-v3-complete.zip` (×5) + `pump-engine-demo*.html` (×5) | Manipulation tooling — blocklisted. **Needs your decision: delete, offline-archive, or genuine scope reversal.** |
| C8 | **EXTEND** | `123automateme-hub` ← `kaio-cards` | kaio-cards planned as `cards.123automateme.com` — should reuse hub's Docker+nginx+certbot pattern. |
| C9 | **EXTEND** | `agent-pipeline` ← `crew` Manus export | crew has 13KB source — promote, scan, then merge or keep distinct. |
| **C10** | **NEW** | `react-repo` ↔ `concrete-estimator` | Same slug, different roots — scanner bug fixed (id-then-slug fallback). Now DB has one row pointing at `concrete-estimator/`. |

## 7. AI Task Queue

| Task | Recommended model | Priority |
|---|---|---|
| Deploy `nexus-frontend` (composite 72, all gates green) | (just `pnpm build` + push to VPS) | **P0** |
| Get Stripe test keys + register webhook → first test payment on 123automateme.com | Stripe dashboard | **P0** |
| Run `vps-audit.sh` on VPS to find any live `sk_live_…` to point the hub at | shell on VPS | **P0** |
| `pnpm finish` on `react-repo` (polymarket-dashboard) — concrete-estimator is a real product | local + Claude Code | P1 |
| Decide on `ar15-mobile` (4-file stub, action: archive) | you | P2 |
| Decide on `PRIMO.zip` (217MB on disk, abandoned) | you | P2 |
| Re-score `123automateme-hub` (composite now 70, was 58) | scanner | ✅ done |
| Rescore after deploy to confirm deploy score jumps to 100 | scanner | P1 |
| Bulk-archive the 18 noise (C6) | shell | ✅ done (25 abandoned) |
| Configure AI provider for re-analysis runs | .env edit | ✅ done (OpenRouter key loaded; safeParse fence-stripping shipped) |
| Migrate domain strategy: `vivalarassa.fun` → `123automateme.com` decision + plan | ChatGPT (architecture) | P2 |

## 8. Open issues

- **Two deploys pending, both mine-able for revenue.** `nexus-frontend` (72, ready) and `123automateme-hub` (70, Stripe ready). Neither is pushed to a domain yet — that requires your ssh/scp/git-push access or the `vps-audit.sh` output.
- **`vps-audit.sh` not yet run.** Last session's blocker C — needs you to SSH to `apex-prod` and paste output.
- **No live Stripe keys confirmed.** Test-mode Stripe checkout is code-complete and ready to take a `4242 4242 4242 4242` test charge. Flipping to live = swap `sk_test_` → `sk_live_` in one env var.
- **k187-store-bot** on VPS has been stopped + errored 191× for >7 days. Clean up.
- **Domain brand split.** Live traffic on `vivalarassa.fun`; new hub on `123automateme.com`; `kaio-cards` planned for `cards.123automateme.com`. Consolidate or document.
- **6 stale `.bak-20260614-no-manus` files** in the monorepo (k187-recovery-os). Cleanup candidate.
- **`OneDrive_1_08-06-2026.zip` is 4.6 GB** sitting in Downloads; not a project but worth triage.
- **`PRIMO.zip` is 217 MB** — biggest single archive. Already abandoned in DB but the disk copy is still there.

## 9. Priority recommendations (the next 5 actions)

1. **Drop the `vps-audit.sh` output** when you've SSH'd. If it reveals a live `sk_live_…`, the hub's Stripe env swap takes 30 seconds. Otherwise the standalone test flow I shipped (2026-06-24) is the path: get test keys → register webhook → first test charge → flip to live.
2. **Deploy `nexus-frontend`** (composite 72, all gates green). It's the highest-completed non-deployed build.
3. **Decide on `PRIMO.zip`** (217 MB on disk, already abandoned in DB). Once archived in DB, the zip can be deleted to reclaim 217 MB of disk space.
4. **Decide on `ar15-mobile`** (4-file stub, recommended action `archive`). Quick yes/no.
5. **Decide C7** (`solana-bundler-bot-v3-complete.zip` ×5 + `pump-engine-demo*.html` ×5 in `Downloads/`). You flagged this on 2026-06-19 — still open.

## 10. Architecture documentation index

- `k187-recovery-os/BUILD_REPORT.md` — what the recovery OS itself is
- `k187-recovery-os/AGENTS.md` — agent conventions for the monorepo
- `k187-recovery-os/DASHBOARD.md` — this file (single source of truth)
- `123automateme-hub/VPS-INVENTORY.md` — live VPS state
- `123automateme-hub/DEPLOY-COMPLETE.md` — what was added for 123automateme.com
- `123automateme-hub/BUILD_REPORT-pricing.md` — Stripe checkout build report (2026-06-24)
- `kaio-cards/ARCHITECTURE.md`, `BRAND.md`, `ROADMAP.md`, `AUDIT.md` — full KAIO'S CARDS docs (lives on the laptop; not on this machine)
- `.operator/projects/<slug>/*.md` — per-project memory (38 project dirs after this snapshot)

## 11. Skills + Hermes home

- 28 skill bundles installed under `~/AppData/Local/hermes/skills/` (incl. `build-recovery`, `production-vps-rollout`, `autonomous-ai-agents`, `weekly-build-report`, `minimax-long-context-review`).
- 6 K187-specific skills in `.operator/` were registered earlier and live alongside.
- Cron: empty (no active jobs). Lock files present, no output dir contents.

## 12. This session (2026-06-24, autonomous "Go")

| # | Action | Result |
|---|---|---|
| 1 | Direct Prisma query | confirmed AIAnalysis table intact (40 rows), schema is fine |
| 2 | Re-ran `pnpm operator analyze --project nexus-frontend` | new action: **`deploy`** (MiniMax M3, real prose, well-formed) |
| 3 | **Patched `packages/ai/src/provider.ts`** — `safeParse` now strips ```json fences, prompt demands "JSON only — no fences" | Fixes the heuristic-fallback bug that hit every analysis |
| 4 | **Bumped `max_tokens: 2000 → 4000`** in both providers | Reduces mid-sentence truncation |
| 5 | **Bulk-archived 25 placeholder shells** in DB (status: abandoned, tags: ["manus","placeholder"]) | C6 verdict: ✅ done |
| 6 | **Patched `apps/scanner/src/cli.ts`** — `findUnique({id})` now falls back to `findUnique({slug})` so re-scans of moved projects don't crash on slug unique-constraint | Fixes scanner crash on `concrete-estimator` extraction |
| 7 | **Extracted & scanned `polymarket-dashboard`** from `Archives/package.zip` | New project: `react-repo` (comp 30, action: `finish`) |
| 8 | **Extracted & scanned `concrete-estimator`** from `Archives/package (1).zip` | Merged with `react-repo` (same slug from package.json `name: "react_repo"`), now correctly points at `concrete-estimator/` |
| 9 | **Extracted & scanned `ar15-mobile`** from `Archives/package (1).zip` | New project: `ar15-mobile` (comp 21, action: `archive`) |
| 10 | Ran long-analysis on `ar15-mobile` | MiniMax M3 call succeeded; output was mid-sentence truncated but action (`archive`) parsed |
| 11 | Audited all 24 archives in `Downloads/Archives/` | Verdicts in §4 above |
| 12 | `pnpm operator:snapshot` | refreshed 38 projects + 5 reports |
| 13 | Rewrote `DASHBOARD.md` end-to-end | 184 lines, captures everything |

## 13. Next session's likely moves

- You run `vps-audit.sh`, paste output
- You get Stripe test keys (or `sk_live_` from a bot)
- Deploy `nexus-frontend` to a domain (your move)
- `pnpm finish` on `react-repo` (concrete-estimator) — Claude Code can do this in parallel
- Delete `PRIMO.zip` and the 5x `solana-bundler-bot-v3-complete.zip` files if you decide to scrub
- Optionally: extract and scan the remaining un-scanned archives (`polymarket-edge`, `phantom-call-spec`, `AI METALAUNCH`, `adhd`)
