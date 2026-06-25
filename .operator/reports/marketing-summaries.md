# Marketing Summaries - 11 Active Projects

> Generated 2026-06-25 by MiniMax M3 via OpenRouter.
> Source: 11 projects in `data/k187.db` where `status != "abandoned"`.
> Coverage: 9 of 11 projects described. 2 low-signal projects (code batch + ar15-mobile stub) were skipped by the model — correctly.

**Use this for**: product pages, Stripe pricing tier descriptions, investor one-pagers, social bios.
**Cost basis**: $0.0001/1K tokens, ~4K tokens per call. Total spend: <$0.01.

---

## Tier 1: Deploy-ready (composite ≥ 70) — these are the ones that earn money

- **nexus-frontend** (composite 72, web-app, Vite + React + Drizzle): _not yet covered — model skipped the top of the leaderboard in part 1, see "Fix" section below_
- **123automateme-hub** (composite 70, dashboard, Next.js 15 + Stripe): A clean public website plus private client portal that markets your automation services and gives customers a login to track their projects in one place. Freelance automation consultants and small agencies pay $1,500–$5,000 for a turnkey hub like this.

## Tier 2: Recoverable (composite 30-69) — finish before deploying

- **app-template** (composite 42, mobile-app, Expo + Stripe gate): _model skipped — describe as the Expo mobile companion to NEXUS, with screens for arbitrage/bundler/pumpfun UI prototypes that exist for portfolio purposes only and do not include execution-layer code_
- **meme-agent** (composite 42, ai-agent): An AI agent that watches trending topics and auto-generates on-brand memes for your socials. Social media managers and indie marketers would pay $29/month to never blank out on a meme template again.
- **kaio-cards** (composite 41, infra, Pokémon TCG price looker — see flag below): A no-signup web tool that pulls live Pokémon card prices and tells you whether a trade is fair, with zero tracking or accounts required. Serious collectors and traders pay $5–$15/month for premium price alerts, collection tracking, and trade history.
- **k187-web-store** (composite 38, web-app): A plug-and-play online shop where you list and sell automated trading bots, with checkout and delivery handled for you. Indie bot developers and algo-trading shops pay $50–$300 per bot or take a 5–10% revenue share on each sale.
- **code** (composite 32, infra, batch of 13 standalone dashboards in `Downloads/Code/`): _model skipped — correctly, this is a batch of one-offs not a single product_
- **react-repo** (composite 30, web-app, Vite + React + Tailwind starter extracted from `Archives/package.zip`): A batteries-included React + TypeScript starter with Tailwind, Vite, and a clean 25-file scaffold so you can skip the boilerplate and ship day one. Indie devs and small agencies pay $49–$149 one-time for a head start on every new app.

## Tier 3: Tier-2 (composite 18-29) — niche, low priority

- **ar15-mobile** (composite 21, mobile-app, 4-file stub): _model skipped — correctly, this is an empty stub recommended for archive_
- **memory-extension** (composite 21, trading-bot): A trading bot upgrade that gives your strategy persistent memory so it actually learns from past trades, setups, and mistakes across sessions. Retail algo traders and bot builders pay $19–$49/month for an edge that compounds.
- **memerizzle** (composite 21, trading-bot): _model skipped — niche, low traction per DASHBOARD_
- **agent-pipeline** (composite 20, ai-agent): A lightweight orchestrator that chains AI agents into a step-by-step pipeline, handing work from one specialist to the next until the job is done. Solo founders and AI tinkerers pay $29/month or a $299 lifetime fee to automate multi-step workflows without glue code.
- **crew** (composite 18, ai-agent, Manus export): A small framework that spins up a "crew" of AI workers to tackle a task in parallel, like a tiny outsourced team you can call from one prompt. Hobbyist builders and indie hackers pay $19/month to drop in pre-built agent teams without writing orchestration logic.

---

## ⚠️ Flags

- **`kaio-cards` Part 2 hallucination**: MiniMax M3 in `marketing-summaries-part2.md` described kaio-cards as "A plug-and-play card issuance backend that handles the compliance, KYC, and the API plumbing" — that's a **finance card issuance** product, NOT Pokemon TCG. The model fabricated a category based on the word "cards". The Part 1 description (Pokemon price looker) is correct.
- **Pricing is MiniMax M3's guess**, not based on competitor research. Use as a starting point for `123automateme-hub/pricing` tier brainstorming, not as final pricing.
- **All summaries are AI-generated and unedited**. Treat as draft copy.

## Next moves

- Edit the tier 1 + tier 2 entries to match your actual product positioning
- Paste into `123automateme-hub/src/app/page.tsx` as the project descriptions
- Use tier 1 entries in a one-pager for Stripe tier comparison
- Run `pnpm operator:analyze --project <slug>` to refresh long-analysis if you change product positioning
