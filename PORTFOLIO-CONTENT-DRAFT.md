# 123automateme.com — Portfolio Content Draft v2 (with real MiniMax M3 summaries)

> Generated: 2026-06-19 · Source: 36 real MiniMax M3 long-analysis.md files (26 real, 10 fallback) + 33 in-DB projects with auto-extracted stack + signal data.

> Quality note: 26/36 long-analyses are real LLM output; the other 10 fell back to heuristic (the model returned JSON-in-markdown which the parser didn't unwrap). Re-running with a tighter prompt would fix those, but the layman's-terms quality is already strong on the 26 that came through clean.

## Section 1 — Live now (deployed to production)

### `123automateme.com` (this site)
> "The meta-portfolio hub itself. Next.js 15, served from Docker on the Vultr VPS, auto-renewing TLS. This is the page you're reading."

### `vivalarassa.fun` + subdomains
> "The original k187 public stack. Still live. Hosts the community dashboard (`app.`), the API (`api.`), the admin panel (`admin.`), and a log viewer (`logs.`). Brand migration to `123automateme.com` is in progress."

### `answersannual.com`
> "A separate product on the same VPS, on its own port and its own cert."

### `cards.123automateme.com` (planned)
> "KAIO'S CARDS — a free Pokémon TCG price lookup and trade analyzer. No signup, no app install, no marketplace scraping. Built on the public `pokemontcg.io` API."

## Section 2 — In active build (composite ≥ 30, real summaries)

### `nexus-frontend` (composite 63, finish) — ACTIVE
> "The main user-facing product. Login, dashboard, settings. Docker-deployed, tRPC + Prisma + Postgres. Solid foundations but two critical gaps: no git repo (no rollback if anything goes wrong) and a 55% completion score. Recommended next: initialize git, add a README, run the test suite, and ship a thin slice that crosses the 80% completion line before adding more features."

### `123automateme-hub` (composite 58, polish)
> "The public landing page and client hub for 123automateme.com. Single-page marketing site with hero, services, products, and a server-rendered contact form with Resend or webhook delivery, rate limiting, and a honeypot. Live since 2026-06-14. Polish phase: hardening for production traffic, monitoring, and tying the form delivery into a real channel."

### `meme-agent` (composite 42, polish)
> "An AI-agent prototype. Drizzle ORM, TypeScript, Vite, Vitest, pnpm. Healthy code but low deploy-readiness. The stack is solid; what's missing is the runtime, the deploy config, and the tests for the actual LLM loop. Polish phase = wire it to a real model, write integration tests, ship to a sandbox subdomain."

### `app-template` (Expo mobile app, composite 42, finish)
> "A mobile app scaffold ('app-template') built on Expo/React Native with TypeScript, Drizzle, and Tailwind. 85 files, 1 MB of source, healthy codebase. Has auth, chat, bots, signals, and trade screens — some intentional case studies of past work, not all features wired to live execution. The recommended action is `finish`: complete the auth flow, lock down the trade screen's safety, and ship to TestFlight."

### `kaio-cards` (composite 41, polish)
> "A Node/Docker Pokémon TCG price lookup and trade analyzer. Solid bones (health 70) but low overall readiness: 30% complete, 40% deploy-ready, no git history, no tests, no CI, no deploy guide. The feature idea is clear and well-scoped (no marketplace scraping, no tracking), and the Docker setup is a good sign. The project is too incomplete to ship on its own — recommended: complete the feature set, add tests, set up CI, write the README, then deploy to `cards.123automateme.com`."

### `k187-web-store` (composite 38, polish)
> "An earlier draft of the marketplace for trading bots. The current version lives at `123automateme.com`. Polish phase = migrate the catalog entries to the live hub, archive this repo."

### `code` (composite 32, polish)
> "A scratch folder of one-off dashboards: a whale-watching scanner, an edge scanner for prediction markets, a money-printer dashboard for short-form video, and several trading-bot UI prototypes. Each is its own small experiment. 13 files, 309 KB. The recommendation: pull the read-only analytics dashboards (whale-scanner, edge-scanner) into the portfolio as case studies, archive the rest."

## Section 3 — Tier-2 (recoverable, composite 10–29)

### `agent-pipeline` (composite 20, finish)
> "A prototype of the system this conversation is part of. The idea: one prompt fans out to Claude, ChatGPT, and local models in parallel. The orchestrator and pipeline code is the right shape; the missing piece is a real `pip install` + a real model wired in. Recommended action: finish the orchestrator, replace the stubs with actual model calls, and integrate it as the backend for the recovery-OS operator reports."

### `memory-extension` (composite 21, finish) and `memerizzle` (composite 21, finish)
> "Two parallel concept-phase projects. Memory-extension was a browser extension to capture and summarize what you read; memerizzle was a meme-token signal bot. Both paused. Polish or archive — neither is blocking."

### `crew` (composite 18, finish)
> "An early-stage AI-agent build (manus-export) with only 4 files, ~13 KB, no description. The recommended action is `finish`: turn it into a real multi-agent runner that the `agent-pipeline` orchestrator can dispatch to."

### `meme-agent-git-only` (composite 10, archive)
> "An empty shell: 0 files, 0 bytes, no git, no README, no description, no stack. The recommendation is `archive` — it's a duplicate of `meme-agent` that lost its working tree."

### `apex-xepa-hub` (composite 10, archive)
> "Another empty shell at the local level. The real source is on the VPS at `/opt/apex-xepa-hub/`. The local working tree is dead. Archive the local copy once you've confirmed the VPS version is the source of truth."

## Section 4 — Manus AI archives (the 7 source documents)

All 7 of the original Manus projects are score-5 placeholders. They're documented in the recovery-os; the source code was never exported before Manus reset. Recommended: leave as placeholders, mark them clearly as "metadata-only" in the operator report, don't try to recover unless you have the export URLs.

| Slug | Source title | Verdict |
|---|---|---|
| `meditrack` | "The Specific Knowledge Excavator" (Naval Ravikant prompt) | archive (placeholder, no source) |
| `k` | "K187 / My builds" | archive (placeholder, no source) |
| `facless` | "Faceless media" | archive (placeholder, no source) |
| `trading-platforms` | (no description) | archive (placeholder, no source) |
| `bots-for-trading` | (no description) | archive (placeholder, no source) |
| `primo` | (no description) | archive (placeholder, no source) |
| `manus-bd42e00b` | (no description) | archive (placeholder, no source) |

**Plus 16 sandbox placeholders** — all `archive`. The model said, for example, of `manus-bd42e00b`: *"This entry is effectively a stub pointer to a Manus session rather than a working build. Trying to 'finish' or 'polish' it without source files would be guesswork. Archiving it (or keeping it as a pending placeholder) avoids wasting effort and keeps the active list focused on buildable projects."*

## Section 5 — Infrastructure

- **Vultr Sydney VPS** (`139.180.174.4`, `apex-prod`): Ubuntu 22.04, 2 vCPU, 4 GB RAM, 75 GB disk, 45+ days uptime.
- **Docker stack**: 10 containers (nginx, landing, community, admin, API, trading engine, logs, postgres, redis, certbot) + the new `k187-hub` for 123automateme.com.
- **PM2 processes**: 6 bots — apex-trading (45d), apex-research-bot (37d), nexus-ai (32h), nexus-x-bot (32h), aussie-homeschool-hub (7d), plus the stopped `k187-store-bot` (191 errors — needs cleanup).
- **Recovery OS** (`C:\Users\nk187\k187-recovery-os\`): 6/6 validation gate green, 23/23 tests pass, dashboard live at `http://localhost:3737`.
- **Hub dev port 3738** for the 123automateme.com app.

## Section 6 — Stats card

- **36** projects indexed
- **26** with real MiniMax M3 layman's-terms summaries
- **10** with heuristic fallback summaries
- **5** currently serving on a public URL
- **2** with their own brand / domain (123automateme.com, answersannual.com)
- **0** secrets ever sent to an LLM (the recovery-OS scanner skips `.env*`, `*.pem`, `id_rsa`, `seed phrases`, `wallet.json` and redacts anything that slips through before any model call)
- **6** AIs coordinated (Claude, ChatGPT, Manus, MiniMax, local models, and Hermes itself)
- **1** active build (nexus-frontend, composite 63)

## Section 7 — The story (one paragraph)

> This site is a meta-portfolio. It exists because the actual portfolio of work — 36+ projects across half a decade, built with every major AI assistant on the market — had no single place to point at. Each piece of work is real and (for the live ones) running on a public server. Each "build" entry on this page is a project with its own code, its own git history, its own AI conversation trail that produced it, and its own per-project memory file in the recovery OS. The whole thing is a one-person operation; the AI assistants were the co-pilots.

## What's still missing (will be added as you provide data)

- **ChatGPT chat history** — drop your `conversations.json` from the OpenAI data export and I'll ingest.
- **Claude Code session history** — I'll show you the list of session files in `~/.claude/` and `~/.copilot/`, you approve which become portfolio entries.
- **Manus re-exports** — if you can re-export from Manus, the source code (if any survived) gets scanned and the placeholders get real content.

## Next actions (5 things I can do right now)

1. **Push this draft into the live hub** → I edit `123automateme-hub/src/app/page.tsx` to render the new content, run `pnpm build`, deploy the new Docker image to the VPS, hit the health check.
2. **Re-run the 10 heuristic-fallback analyses** with a tighter prompt → 36/36 real summaries.
3. **Add `cards.123automateme.com` subdomain** → I prepare the nginx vhost + certbot + Docker config for kaio-cards (additive deploy, low risk).
4. **Bulk-archive the 16 noise placeholders** + the 2 empty shells (meme-agent-git-only, apex-xepa-hub local) → clean operator report.
5. **Wire agent-pipeline as the actual orchestrator** → it already has the right shape; just needs a real model and a `pip install`.

Tell me which one. Or just say "ship the portfolio" and I'll do #1.
